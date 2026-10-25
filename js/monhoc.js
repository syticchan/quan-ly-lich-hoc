(function () {
    'use strict';

    const STORAGE_KEY = 'data_mon_hoc';
    const SCHEDULE_KEY = 'data_lich_hoc';

    const loadSubjects = () => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
    };
    const loadSchedules = () => {
        try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || []; } catch (e) { return []; }
    };
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

    const esc = s => String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const $ = id => document.getElementById(id);

    const subjectBody = $('subjectBody');
    const emptyText = $('emptyText');
    const tableWrap = document.querySelector('.table-wrap');
    const searchInput = $('searchInput');
    const formModal = $('formModal');
    const confirmModal = $('confirmModal');
    const form = $('subjectForm');

    const f = {
        id: $('fId'), code: $('fCode'), name: $('fName'),
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

    const openModal = m => { m.hidden = false; };
    const closeModal = m => { m.hidden = true; };

    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('mousedown', e => { if (e.target === m) closeModal(m); });
        m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(m)));
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') document.querySelectorAll('.modal').forEach(closeModal);
    });

    function showErrors(errs = {}) {
        Object.keys(f).forEach(k => {
            const errEl = form.querySelector(`[data-err="${k}"]`);
            if (errEl) errEl.textContent = errs[k] || '';
            f[k].classList.toggle('invalid', !!errs[k]);
        });
    }

    function validate(data) {
        const errs = {};

        if (!data.code) errs.code = 'Vui lòng nhập mã môn';
        else if (subjects.some(s => s.id !== currentId && s.code.toLowerCase() === data.code.toLowerCase()))
            errs.code = 'Mã môn đã tồn tại';

        if (!data.name) errs.name = 'Vui lòng nhập tên môn học';
        if (!data.teacher) errs.teacher = 'Vui lòng nhập tên giảng viên';

        if (!/^\d+$/.test(f.credit.value.trim()) || data.credit < 1 || data.credit > 10)
            errs.credit = 'Số tín chỉ từ 1 đến 10';

        return errs;
    }

    function openForm(id) {
        showErrors();
        currentId = id || null;
        const s = subjects.find(x => x.id === currentId) || {};

        $('formTitle').textContent = currentId ? 'Sửa môn học' : 'Thêm môn học';
        $('btnSubmit').textContent = currentId ? 'Lưu thay đổi' : 'Thêm môn học';

        f.id.value = s.id || '';
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
            name: f.name.value.trim(),
            teacher: f.teacher.value.trim(),
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