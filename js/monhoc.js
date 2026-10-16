// js/monhoc.js - XỬ LÝ TRANG MÔN HỌC (xem, thêm, sửa, xóa, tìm kiếm)
(function () {
    'use strict';

    /* ============ 1. DỮ LIỆU ============ */

    // Tên khóa lưu trong localStorage (Lịch học dùng khóa khác: 'data_lh_ca')
    const STORAGE_KEY = 'data_mon_hoc';

    // Mỗi môn học là một object: { id, code, name, teacher, room, credit }
    const loadSubjects = () => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
    };
    const saveSubjects = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));

    let subjects = loadSubjects();
    let currentId = null; // id của môn đang sửa hoặc đang chờ xóa

    // Chống chèn mã HTML khi in dữ liệu người dùng nhập ra bảng
    const esc = s => String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /* ============ 2. LẤY CÁC PHẦN TỬ TRONG HTML ============ */

    const $ = id => document.getElementById(id);

    const subjectBody = $('subjectBody');
    const emptyText = $('emptyText');
    const tableWrap = document.querySelector('.table-wrap');
    const searchInput = $('searchInput');
    const formModal = $('formModal');
    const confirmModal = $('confirmModal');
    const form = $('subjectForm');

    // Gom các ô nhập vào một object cho dễ dùng
    const f = {
        id: $('fId'), code: $('fCode'), name: $('fName'),
        teacher: $('fTeacher'), room: $('fRoom'), credit: $('fCredit')
    };

    /* ============ 3. HIỂN THỊ DANH SÁCH ============ */

    function render() {
        // Lọc theo từ khóa tìm kiếm (tìm trong mã môn, tên môn, giảng viên, phòng học)
        const keyword = searchInput.value.trim().toLowerCase();
        const list = subjects.filter(s =>
            [s.code, s.name, s.teacher, s.room].join(' ').toLowerCase().includes(keyword));

        // Mỗi môn học là một dòng <tr>
        subjectBody.innerHTML = list.map((s, i) => `<tr>
            <td>${i + 1}</td>
            <td>${esc(s.code)}</td>
            <td>${esc(s.name)}</td>
            <td>${esc(s.teacher)}</td>
            <td>${esc(s.room)}</td>
            <td>${s.credit}</td>
            <td>
                <button type="button" class="action-btn edit" data-id="${s.id}" title="Sửa" aria-label="Sửa môn ${esc(s.name)}"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="action-btn delete" data-id="${s.id}" title="Xóa" aria-label="Xóa môn ${esc(s.name)}"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`).join('');

        // Không có dòng nào thì ẩn bảng và hiện câu thông báo
        tableWrap.hidden = list.length === 0;
        emptyText.hidden = list.length > 0;
        emptyText.textContent = subjects.length === 0
            ? 'Chưa có môn học nào. Bấm "Thêm môn học" để bắt đầu.'
            : 'Không tìm thấy môn học phù hợp.';
    }

    /* ============ 4. MỞ / ĐÓNG HỘP THOẠI ============ */

    const openModal = m => { m.hidden = false; };
    const closeModal = m => { m.hidden = true; };

    document.querySelectorAll('.modal').forEach(m => {
        // Bấm ra vùng nền mờ thì đóng
        m.addEventListener('mousedown', e => { if (e.target === m) closeModal(m); });
        // Bấm nút có thuộc tính data-close (nút X, nút Hủy) thì đóng
        m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(m)));
    });

    // Nhấn phím Esc cũng đóng hộp thoại
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') document.querySelectorAll('.modal').forEach(closeModal);
    });

    /* ============ 5. KIỂM TRA DỮ LIỆU NHẬP ============ */

    // Hiện (hoặc xóa) thông báo lỗi dưới từng ô; errs = { code: '...', name: '...' }
    function showErrors(errs = {}) {
        Object.keys(f).forEach(k => {
            const errEl = form.querySelector(`[data-err="${k}"]`);
            if (errEl) errEl.textContent = errs[k] || '';
            f[k].classList.toggle('invalid', !!errs[k]);
        });
    }

    // Trả về object chứa các lỗi; rỗng nghĩa là dữ liệu hợp lệ
    function validate(data) {
        const errs = {};

        if (!data.code) errs.code = 'Vui lòng nhập mã môn';
        else if (subjects.some(s => s.id !== currentId && s.code.toLowerCase() === data.code.toLowerCase()))
            errs.code = 'Mã môn đã tồn tại';

        if (!data.name) errs.name = 'Vui lòng nhập tên môn học';
        if (!data.teacher) errs.teacher = 'Vui lòng nhập tên giảng viên';
        if (!data.room) errs.room = 'Vui lòng nhập phòng học';

        if (!/^\d+$/.test(f.credit.value.trim()) || data.credit < 1 || data.credit > 10)
            errs.credit = 'Số tín chỉ từ 1 đến 10';

        return errs;
    }

    /* ============ 6. THÊM / SỬA MÔN HỌC ============ */

    // Mở form: không truyền id = thêm mới, có id = sửa
    function openForm(id) {
        showErrors(); // xóa lỗi cũ
        currentId = id || null;
        const s = subjects.find(x => x.id === currentId) || {};

        $('formTitle').textContent = currentId ? 'Sửa môn học' : 'Thêm môn học';
        $('btnSubmit').textContent = currentId ? 'Lưu thay đổi' : 'Thêm môn học';

        // Điền sẵn dữ liệu khi sửa, để trống (tín chỉ mặc định 3) khi thêm
        f.id.value = s.id || '';
        f.code.value = s.code || '';
        f.name.value = s.name || '';
        f.teacher.value = s.teacher || '';
        f.room.value = s.room || '';
        f.credit.value = s.credit || 3;

        openModal(formModal);
        f.code.focus();
    }

    // Bấm nút "Thêm môn học" / "Lưu thay đổi"
    form.addEventListener('submit', e => {
        e.preventDefault();

        const data = {
            code: f.code.value.trim().toUpperCase(), // mã môn luôn viết hoa
            name: f.name.value.trim(),
            teacher: f.teacher.value.trim(),
            room: f.room.value.trim(),
            credit: Number(f.credit.value)
        };

        const errs = validate(data);
        showErrors(errs);
        if (Object.keys(errs).length) return; // có lỗi thì dừng, không lưu

        if (currentId) {
            // Sửa: tìm môn đang sửa rồi ghi đè thông tin mới
            Object.assign(subjects.find(s => s.id === currentId), data);
        } else {
            // Thêm: tạo id mới bằng thời gian hiện tại
            subjects.push({ id: String(Date.now()), ...data });
        }

        saveSubjects();
        closeModal(formModal);
        searchInput.value = ''; // xóa từ khóa để thấy ngay môn vừa thêm/sửa
        render();
    });

    /* ============ 7. XÓA MÔN HỌC ============ */

    // Hỏi xác nhận trước khi xóa
    function askDelete(id) {
        const s = subjects.find(x => x.id === id);
        currentId = id;
        $('confirmText').textContent = `Xóa môn học "${s.name}" (${s.code})?`;
        openModal(confirmModal);
    }

    // Bấm "Xóa môn học" trong hộp thoại xác nhận
    $('confirmYes').addEventListener('click', () => {
        subjects = subjects.filter(s => s.id !== currentId);
        saveSubjects();
        closeModal(confirmModal);
        render();
    });

    /* ============ 8. GẮN SỰ KIỆN ============ */

    $('btnAdd').addEventListener('click', () => openForm());

    // Các nút Sửa/Xóa do JS tạo ra nên bắt sự kiện ở <tbody> (event delegation)
    subjectBody.addEventListener('click', e => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        if (btn.classList.contains('edit')) openForm(btn.dataset.id);
        else askDelete(btn.dataset.id);
    });

    // Gõ vào ô tìm kiếm thì lọc lại danh sách ngay
    searchInput.addEventListener('input', render);

    // Vẽ danh sách lần đầu khi mở trang
    render();
})();