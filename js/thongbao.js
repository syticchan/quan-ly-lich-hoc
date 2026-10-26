(function () {
    'use strict';

    const STORAGE_KEY = userKey('data_thong_bao');

    const NOTICE_TEMPLATES = [
        {
            title: 'Thay đổi phòng học',
            content: 'Phòng học 204-A5 hiện đang sửa, các lớp chuyển sang phòng 203-A5.\nBắt đầu áp dụng từ ca 3 (12:30-15:00) ngày 26/10/2026 (Thứ 2).',
            date: '2026-10-26', time: '08:30', read: false
        },
        {
            title: 'Thông báo nghỉ học',
            content: 'Ngày 29/10/2026 (Thứ 5), các lớp nghỉ học.',
            date: '2026-10-25', time: '10:37', read: false
        },
        {
            title: 'Thông báo về tài liệu học tập',
            content: 'Tài liệu học tập đã được cập nhật lên hệ thống.',
            date: '2026-09-23', time: '14:55', read: true
        }
    ];

    const pad = n => String(n).padStart(2, '0');
    const esc = s => String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const toHM = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const fmtDMY = iso => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

    const sortKey = n => `${n.date}T${String(n.time).padStart(5, '0')}`;
    const sortNotices = list => list.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

    function loadNotices() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw === null) {
                const seeded = NOTICE_TEMPLATES.map((t, i) => ({ id: `tpl-${i}`, ...t }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
                return seeded;
            }
            return JSON.parse(raw) || [];
        } catch (e) { return []; }
    }
    const saveNotices = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));

    let notices = loadNotices();
    const findNotice = id => notices.find(n => n.id === id);

    let currentTab = 'tatca';
    let selectedId = null;

    const $ = id => document.getElementById(id);
    const listEl = $('danhSachItem');
    const formModal = $('formModal');
    const confirmModal = $('confirmModal');
    const form = $('noticeForm');
    const f = { title: $('fTitle'), content: $('fContent'), date: $('fDate') };

    function matchTab(n) {
        return currentTab === 'tatca' || (currentTab === 'chuadoc' ? !n.read : n.read);
    }

    function renderItem(n) {
        const selected = n.id === selectedId ? ' dang-chon' : '';
        return `<div class="itemthongbao ${n.read ? 'dadoc' : 'chuadoc'}${selected}" data-id="${esc(n.id)}">
                    <div class="noidungitem">
                        ${n.read ? '' : '<div class="chamchuadoc"></div>'}
                        <div class="textitem">
                            <h4>${esc(n.title)}</h4>
                            <p>${esc(n.content.replace(/\s*\n\s*/g, ' '))}</p>
                        </div>
                    </div>
                    <div class="thongtinphu">
                        <span class="ngaythang">${fmtDMY(n.date)}</span>
                        <span class="${n.read ? 'nhandandadoc' : 'nhandanchuadoc'}">${n.read ? 'Đã đọc' : 'Chưa đọc'}</span>
                    </div>
                </div>`;
    }

    function renderList() {
        const shown = sortNotices([...notices]).filter(n => matchTab(n) || n.id === selectedId);
        listEl.innerHTML = shown.length
            ? shown.map(renderItem).join('')
            : '<div class="textitem"><p style="padding:20px;text-align:center">Không có thông báo nào.</p></div>';
    }

    function renderTabs() {
        const unread = notices.filter(n => !n.read).length;
        const label = {
            tatca: `Tất cả (${notices.length})`,
            chuadoc: `Chưa đọc (${unread})`,
            dadoc: `Đã đọc (${notices.length - unread})`
        };
        document.querySelectorAll('.nutloc').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === currentTab);
            btn.textContent = label[btn.dataset.tab];
        });
    }

    function renderDetail() {
        const n = selectedId ? findNotice(selectedId) : null;
        $('thoigianchitiet').hidden = !n;
        $('hanhdongchitiet').hidden = !n;

        if (!n) {
            $('tieudecitiet').textContent = 'Chi tiết thông báo';
            $('noidungchitiet').textContent = 'Chọn một thông báo để xem chi tiết.';
            return;
        }

        $('tieudecitiet').textContent = n.title;
        $('ngaygiochitiet').textContent = `${fmtDMY(n.date)} - ${n.time}`;
        $('noidungchitiet').textContent = n.content;
        $('btnToggleRead').innerHTML = n.read
            ? '<i class="fa-regular fa-envelope"></i> Đánh dấu chưa đọc'
            : '<i class="fa-regular fa-envelope-open"></i> Đánh dấu đã đọc';
    }

    function render() { renderTabs(); renderList(); renderDetail(); }

    const openModal = m => { m.hidden = false; };
    const closeModal = m => { m.hidden = true; };

    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('mousedown', e => { if (e.target === m) closeModal(m); });
        m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(m)));
    });

    const inputs = { title: [f.title], content: [f.content], date: [f.date] };
    function showErrors(errs = {}) {
        Object.keys(inputs).forEach(k => {
            const errEl = form.querySelector(`[data-err="${k}"]`);
            if (errEl) errEl.textContent = errs[k] || '';
            inputs[k].forEach(i => i.classList.toggle('invalid', !!errs[k]));
        });
    }

    function selectNotice(id) {
        const n = findNotice(id);
        if (!n) return;
        selectedId = id;
        if (!n.read) {
            n.read = true;
            saveNotices();
        }
        render();
    }

    function openForm() {
        showErrors();
        form.reset();
        f.date.value = toISO(new Date());
        openModal(formModal);
    }

    form.addEventListener('submit', e => {
        e.preventDefault();

        const title = f.title.value.trim();
        const content = f.content.value.trim();
        const date = f.date.value;
        const parsedDate = date ? parseISO(date) : null;

        let dateErr = '';
        if (!date) dateErr = 'Ngày đăng không hợp lệ';
        else if (parsedDate.getFullYear() < 2000) dateErr = 'Năm đăng không hợp lệ';

        const errs = {
            title: title ? '' : 'Vui lòng nhập tiêu đề',
            content: content ? '' : 'Vui lòng nhập nội dung',
            date: dateErr
        };
        showErrors(errs);
        if (Object.values(errs).some(Boolean)) return;

        notices.push({
            id: String(Date.now()),
            title, content, date,
            time: toHM(new Date()),
            read: false
        });

        saveNotices();
        closeModal(formModal);
        currentTab = 'tatca';
        render();
    });

    function askDelete(id) {
        const n = findNotice(id);
        if (!n) return;
        $('confirmText').textContent = `Xóa thông báo "${n.title}"?`;
        openModal(confirmModal);
    }

    $('confirmYes').addEventListener('click', () => {
        notices = notices.filter(n => n.id !== selectedId);
        selectedId = null;
        saveNotices();
        closeModal(confirmModal);
        render();
    });

    $('btnToggleRead').addEventListener('click', () => {
        const n = findNotice(selectedId);
        if (!n) return;
        n.read = !n.read;
        saveNotices();
        render();
    });

    $('btnDelete').addEventListener('click', () => askDelete(selectedId));
    $('btnAdd').addEventListener('click', openForm);

    listEl.addEventListener('click', e => {
        const item = e.target.closest('.itemthongbao');
        if (item) selectNotice(item.dataset.id);
    });

    document.querySelector('.thanhboloc').addEventListener('click', e => {
        const btn = e.target.closest('.nutloc');
        if (!btn) return;
        currentTab = btn.dataset.tab;
        render();
    });

    render();
})();