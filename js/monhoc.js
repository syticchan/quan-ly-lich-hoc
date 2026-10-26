(function () {
    'use strict';

    const STORAGE_KEY = userKey('data_mon_hoc');
    const SCHEDULE_KEY = userKey('data_lich_hoc');

    const loadSubjects = () => loadList(STORAGE_KEY);
    const loadSchedules = () => loadList(SCHEDULE_KEY);
    const saveSubjects = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    const saveSchedules = list => localStorage.setItem(SCHEDULE_KEY, JSON.stringify(list));
    const isOfSubject = (e, s) => e.subjectId ? e.subjectId === s.id : e.name === s.name;
    const countSchedules = s => loadSchedules().filter(e => isOfSubject(e, s)).length;
    const removeSchedules = s => saveSchedules(loadSchedules().filter(e => !isOfSubject(e, s)));
    const syncSchedules = (s, data) => {
        const list = loadSchedules();
        list.forEach(e => {
            if (isOfSubject(e, s)) {
                e.subjectId = s.id;
                e.name = data.name;
            }
        });
        saveSchedules(list);
    };

    let subjects = loadSubjects();
    let currentId = null;

    const $ = id => document.getElementById(id);
    const squash = s => String(s).normalize('NFC').trim().replace(/\s+/g, ' ');

    const subjectBody = $('subjectBody');
    const emptyText = $('emptyText');
    const tableWrap = document.querySelector('.table-wrap');
    const searchInput = $('searchInput');
    const formModal = $('formModal');
    const confirmModal = $('confirmModal');
    const form = $('subjectForm');

    const f = {
        code: $('fCode'), name: $('fName'),
        teacher: $('fTeacher'), credit: $('fCredit')
    };

    function render() {
        const keyword = searchInput.value.trim().toLowerCase();
        const list = subjects.filter(s =>
            [s.code, s.name, s.teacher].join(' ').toLowerCase().includes(keyword));

        subjectBody.innerHTML = list.map((s, i) => `<tr>
            <td>${i + 1}</td>
            <td>${esc(s.code)}</td>
            <td>${esc(s.name)}</td>
            <td>${esc(s.teacher)}</td>
            <td>${s.credit}</td>
            <td>
                <button type="button" class="action-btn edit" data-id="${s.id}" title="Sửa" aria-label="Sửa môn ${esc(s.name)}"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="action-btn delete" data-id="${s.id}" title="Xóa" aria-label="Xóa môn ${esc(s.name)}"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`).join('');

        tableWrap.hidden = list.length === 0;
        emptyText.hidden = list.length > 0;
        emptyText.textContent = subjects.length === 0
            ? 'Chưa có môn học nào. Bấm "Thêm môn học" để bắt đầu.'
            : 'Không tìm thấy môn học phù hợp.';
    }

    const showErrors = (errs = {}) => showFormErrors(form, f, errs);

    function validate(data) {
        const errs = {};

        if (!data.code) errs.code = 'Vui lòng nhập mã môn';
        else if (!/^[A-Z0-9_-]+$/.test(data.code))
            errs.code = 'Mã môn chỉ gồm chữ cái, chữ số, dấu "-" hoặc "_" (không có khoảng trắng)';
        else if (subjects.some(s => s.id !== currentId && s.code.toLowerCase() === data.code.toLowerCase()))
            errs.code = 'Mã môn đã tồn tại';

        if (!data.name) errs.name = 'Vui lòng nhập tên môn học';

        if (!data.teacher) errs.teacher = 'Vui lòng nhập tên giảng viên';
        else if (/\d/.test(data.teacher)) errs.teacher = 'Tên giảng viên không được chứa chữ số';
        else if (!/^\p{L}[\p{L}\s.]*$/u.test(data.teacher))
            errs.teacher = 'Tên giảng viên chỉ được chứa chữ cái, khoảng trắng và dấu chấm';

        if (!/^\d+$/.test(f.credit.value.trim()) || data.credit < 1 || data.credit > 10)
            errs.credit = 'Số tín chỉ phải là số nguyên từ 1 đến 10';

        return errs;
    }

    function openForm(id) {
        showErrors();
        currentId = id || null;
        const s = subjects.find(x => x.id === currentId) || {};

        $('formTitle').textContent = currentId ? 'Sửa môn học' : 'Thêm môn học';
        $('btnSubmit').textContent = currentId ? 'Lưu thay đổi' : 'Thêm môn học';

        f.code.value = s.code || '';
        f.name.value = s.name || '';
        f.teacher.value = s.teacher || '';
        f.credit.value = s.credit || 3;

        openModal(formModal);
        f.code.focus();
    }

    form.addEventListener('submit', e => {
        e.preventDefault();

        const data = {
            code: f.code.value.trim().toUpperCase(),
            name: squash(f.name.value),
            teacher: squash(f.teacher.value),
            credit: Number(f.credit.value)
        };

        const errs = validate(data);
        showErrors(errs);
        if (Object.keys(errs).length) return;

        if (currentId) {
            const s = subjects.find(x => x.id === currentId);
            syncSchedules(s, data);
            Object.assign(s, data);
        } else {
            subjects.push({ id: String(Date.now()), ...data });
        }

        saveSubjects();
        closeModal(formModal);
        searchInput.value = '';
        render();
    });

    function askDelete(id) {
        const s = subjects.find(x => x.id === id);
        currentId = id;
        const n = countSchedules(s);
        $('confirmText').textContent = n > 0
            ? `Xóa môn học "${s.name}" (${s.code})? ${n} lịch học của môn này cũng sẽ bị xóa.`
            : `Xóa môn học "${s.name}" (${s.code})?`;
        openModal(confirmModal);
    }

    $('confirmYes').addEventListener('click', () => {
        const s = subjects.find(x => x.id === currentId);
        if (s) removeSchedules(s);
        subjects = subjects.filter(x => x.id !== currentId);
        saveSubjects();
        closeModal(confirmModal);
        render();
    });

    $('btnAdd').addEventListener('click', () => openForm());

    subjectBody.addEventListener('click', e => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        if (btn.classList.contains('edit')) openForm(btn.dataset.id);
        else askDelete(btn.dataset.id);
    });

    searchInput.addEventListener('input', render);

    render();
})();