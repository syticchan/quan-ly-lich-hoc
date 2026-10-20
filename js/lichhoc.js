(function () {
    'use strict';

    const STORAGE_KEY = 'data_lich_hoc';

    const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const DAYS_SHOWN = 6;

    const CA_LIST = [
        { ca: 1, start: '07:00', end: '09:30', tiet: '1 - 3' },
        { ca: 2, start: '09:30', end: '12:00', tiet: '4 - 6' },
        { ca: 3, start: '12:30', end: '15:00', tiet: '7 - 9' },
        { ca: 4, start: '15:00', end: '17:30', tiet: '10 - 12' },
        { ca: 5, start: '17:30', end: '20:00', tiet: '13 - 15' }
    ];
    const getCa = n => CA_LIST.find(c => c.ca === Number(n));

    const PALETTE = [
        { bg: '#dbeafe', bd: '#3b82f6', tx: '#1e3a8a' },
        { bg: '#dcfce7', bd: '#22c55e', tx: '#14532d' },
        { bg: '#e5e7eb', bd: '#6b7280', tx: '#1f2937' },
        { bg: '#ede9fe', bd: '#8b5cf6', tx: '#4c1d95' },
        { bg: '#ffedd5', bd: '#f97316', tx: '#7c2d12' },
        { bg: '#fce7f3', bd: '#ec4899', tx: '#831843' }
    ];

    const pad = n => String(n).padStart(2, '0');
    const esc = s => String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const dayIndex = d => (d.getDay() + 6) % 7;
    const startOfWeek = d => addDays(d, -dayIndex(d));
    const fmtDM = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

    const isDone = ev => new Date() >= new Date(`${ev.date}T${getCa(ev.ca).end}`);

    function colorIndexFor(name) {
        let h = 0;
        for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return h % PALETTE.length;
    }

    const loadEvents = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; } };
    const saveEvents = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

    const SUBJECT_KEY = 'data_mon_hoc';
    const loadSubjects = () => {
        try { return JSON.parse(localStorage.getItem(SUBJECT_KEY)) || []; } catch (e) { return []; }
    };

    let events = loadEvents();
    const findEvent = id => events.find(e => e.id === id);

    let weekStart = startOfWeek(new Date());
    let miniMonth = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
    let currentId = null;

    const $ = id => document.getElementById(id);
    const weekGrid = $('weekGrid');
    const miniGrid = $('miniGrid');
    const formModal = $('formModal');
    const detailModal = $('detailModal');
    const confirmModal = $('confirmModal');
    const form = $('scheduleForm');
    const f = {
        name: $('fName'), date: $('fDate'), ca: $('fCa'),
        room: $('fRoom'), teacher:$('fTeacher'),
        repeat: $('fRepeat')
    };

    function renderEvent(e) {
        const p = PALETTE[colorIndexFor(e.name)];
        return `<div class="ev${isDone(e) ? ' is-done' : ''}" data-id="${e.id}"
                     style="--bg:${p.bg};--bd:${p.bd};--tx:${p.tx}">
                    <span class="ev-title">${esc(e.name)}</span>
                    ${e.room ? `<span class="ev-meta">${esc(e.room)}</span>` : ''}
                </div>`;
    }

    function renderWeek() {
        const todayISO = toISO(new Date());
        let heads = '<th class="wg-corner">Ca / Tiết</th>', rows = '';

        for (let i = 0; i < DAYS_SHOWN; i++) {
            const d = addDays(weekStart, i);
            const today = toISO(d) === todayISO ? ' today' : '';
            heads += `<th class="wg-head${today}"><strong>${DAY_NAMES[i]}</strong><small>${fmtDM(d)}</small></th>`;
        }

        CA_LIST.forEach(c => {
            let cells = '';
            for (let i = 0; i < DAYS_SHOWN; i++) {
                const iso = toISO(addDays(weekStart, i));
                const today = iso === todayISO ? ' today' : '';
                const ev = events.find(e => e.date === iso && Number(e.ca) === c.ca);
                cells += `<td class="wg-cell${today}" data-date="${iso}" data-ca="${c.ca}">${ev ? renderEvent(ev) : ''}</td>`;
            }
            rows += `<tr>
                        <th class="wg-ca">
                            <strong>Ca ${c.ca}</strong>
                            <small>(${c.start} - ${c.end})</small>
                            <small>Tiết ${c.tiet}</small>
                        </th>${cells}
                     </tr>`;
        });

        weekGrid.innerHTML = `<thead><tr>${heads}</tr></thead><tbody>${rows}</tbody>`;
    }

    function renderMini() {
        $('miniTitle').textContent = `Tháng ${miniMonth.getMonth() + 1}, ${miniMonth.getFullYear()}`;

        const mark = {};
        events.forEach(e => {
            const currentMark = mark[e.date];
            if (!isDone(e)) {
                mark[e.date] = 'has-todo';
            } else if (!currentMark) {
                mark[e.date] = 'has-done';
            }
        });

        const todayISO = toISO(new Date());
        const wkEnd = addDays(weekStart, 6);
        let html = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(n => `<div class="mini-dow">${n}</div>`).join('');

        const first = startOfWeek(miniMonth);
        for (let i = 0; i < 42; i++) {
            const d = addDays(first, i);
            const iso = toISO(d);
            const cls = ['mini-day', mark[iso]];
            if (d.getMonth() !== miniMonth.getMonth()) cls.push('other');
            if (d >= weekStart && d <= wkEnd) {
                cls.push('in-week');
                if (dayIndex(d) === 0) cls.push('wk-start');
                if (dayIndex(d) === 6) cls.push('wk-end');
            }
            if (iso === todayISO) cls.push('today');
            html += `<button type="button" class="${cls.join(' ')}" data-date="${iso}"><span>${d.getDate()}</span></button>`;
        }
        miniGrid.innerHTML = html;
    }

    function render() { renderWeek(); renderMini(); }

    function goToWeekOf(date) {
        weekStart = startOfWeek(date);
        miniMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        render();
    }

    const openModal = m => { m.hidden = false; };
    const closeModal = m => { m.hidden = true; };

    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('mousedown', e => { if (e.target === m) closeModal(m); });
        m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(m)));
    });

    const inputs = { name: [f.name], date: [f.date], ca: [f.ca], room: [f.room], repeat: [f.repeat] };
    function showErrors(errs = {}) {
        Object.keys(inputs).forEach(k => {
            const errEl = form.querySelector(`[data-err="${k}"]`);
            if (errEl) errEl.textContent = errs[k] || '';
            inputs[k].forEach(i => i.classList.toggle('invalid', !!errs[k]));
        });
    }

        function checkCa(date, ca, weeks, isEditAll = false) {
        if (!ca) return 'Vui lòng chọn ca học';

        const ev = currentId ? findEvent(currentId) : null;
        const skip = isEditAll && ev ? e => e.group === ev.group : e => e.id === currentId;
        let dates = [];
        if (isEditAll && ev) {
            const groupEvents = events.filter(e => e.group === ev.group).sort((a, b) => a.date.localeCompare(b.date));
            const first = addDays(parseISO(date), -groupEvents.findIndex(e => e.id === ev.id) * 7);
            dates = groupEvents.map((_, index) => toISO(addDays(first, index * 7)));
        } else {
            dates = Array.from({ length: Math.min(weeks || 0, 52) }, (_, i) => toISO(addDays(parseISO(date), i * 7)));
        }

        for (const dStr of dates) {
            const c = events.find(e => !skip(e) && e.date === dStr && Number(e.ca) === ca);
            if (c) {
                const cc = getCa(c.ca);
                return `Trùng ca với: ${c.name} (${fmtDM(parseISO(c.date))}, Ca ${c.ca}: ${cc.start} - ${cc.end})`;
            }
        }
        return '';
    }

    function fillSubjectOptions(selected = '') {
        const subjects = loadSubjects();
        let html = '<option value="">-- Chọn môn học --</option>' +
            subjects.map(s => `<option value="${esc(s.name)}">${esc(s.code)} - ${esc(s.name)}</option>`).join('');

        if (selected && !subjects.some(s => s.name === selected)) {
            html += `<option value="${esc(selected)}">${esc(selected)}</option>`;
        }

        f.name.innerHTML = html;
        f.name.value = selected;
    }

    function openForm(opts = {}) {
        showErrors();
        currentId = opts.id || null;
        const ev = findEvent(currentId) || {};

        $('formTitle').textContent = currentId ? 'Sửa lịch học' : 'Thêm lịch học';
        $('btnSubmit').textContent = currentId ? 'Lưu thay đổi' : 'Thêm lịch';

        const today = new Date();
        const inWeek = today >= weekStart && today < addDays(weekStart, 7) && dayIndex(today) < DAYS_SHOWN;

        fillSubjectOptions(ev.name || '');
        f.date.value = ev.date || opts.date || toISO(inWeek ? today : weekStart);
        f.ca.value = ev.ca || opts.ca || '';
        f.room.value = ev.room || '';
        f.teacher.value = ev.teacher || '';
        f.repeat.value = 1;
        
        $('repeatField').hidden = !!currentId;

        if (currentId && !ev.group) {
            ev.group = `group-${currentId}`;
            saveEvents();
        }

        const groupCount = currentId && ev.group ? events.filter(e => e.group === ev.group).length : 0;
        const editAllWrap = $('editAllWrap');
        if (editAllWrap) {
            editAllWrap.hidden = !currentId || groupCount < 2;
            $('editAll').checked = true;
            $('editAllText').textContent = `Áp dụng cho tất cả ${groupCount} lịch lặp`;
        }

        openModal(formModal);
    }

    form.addEventListener('submit', e => {
        e.preventDefault();

        const name = f.name.value.trim();
        const date = f.date.value;
        const ca = Number(f.ca.value);
        const editAllCheckbox = $('editAll');
        const isEditAll = currentId && editAllCheckbox && !editAllCheckbox.hidden && editAllCheckbox.checked;
        const repeatVal = f.repeat.value.trim();
        const weeks = Number(repeatVal);

        const parsedDate = date ? parseISO(date) : null;

        let dateErr = '';
        if (!date) dateErr = 'Ngày học không hợp lệ';
        else if (parsedDate.getFullYear() < 2000) dateErr = 'Năm học không hợp lệ';
        else if (dayIndex(parsedDate) >= DAYS_SHOWN) dateErr = 'Chỉ xếp lịch từ Thứ 2 đến Thứ 7';

        const errs = {
            name: name ? '' : (loadSubjects().length ? 'Vui lòng chọn môn học' : 'Không có môn học'),
            date: dateErr,
            ca: dateErr ? (ca ? '' : 'Vui lòng chọn ca học') : checkCa(date, ca, weeks, isEditAll),
            room: f.room.value.trim() ? '' : 'Vui lòng nhập phòng học',
            repeat: (!currentId && (!/^\d+$/.test(repeatVal) || weeks < 1 || weeks > 52)) ? 'Số tuần học chỉ từ 1 đến 52 tuần' : ''
        };
        showErrors(errs);
        if (Object.values(errs).some(Boolean)) return;

        const data = {
            name, date, ca,
            room: f.room.value.trim(),
            teacher: f.teacher.value.trim()
        };

        if (currentId) {
            const ev = findEvent(currentId);
            
            if (isEditAll && ev.group) {
                const groupEvents = events.filter(e => e.group === ev.group).sort((a, b) => a.date.localeCompare(b.date));
                const first = addDays(parseISO(date), -groupEvents.findIndex(e => e.id === ev.id) * 7);

                groupEvents.forEach((item, index) => {
                    item.name = data.name;
                    item.ca = data.ca;
                    item.room = data.room;
                    item.teacher = data.teacher;
                    item.date = toISO(addDays(first, index * 7));
                });
            } else {
                Object.assign(ev, data);
            }
        } else {
            const group = String(Date.now());
            for (let i = 0; i < weeks; i++) {
                events.push({ id: `${group}-${i}`, group, ...data, date: toISO(addDays(parseISO(date), i * 7)) });
            }
        }

        saveEvents();
        closeModal(formModal);
        goToWeekOf(parseISO(date));
    });

    function openDetail(id) {
        const ev = findEvent(id);
        currentId = id;
        const d = parseISO(ev.date);
        const c = getCa(ev.ca);
        const done = isDone(ev);
        $('detailBody').innerHTML = `
            <dt>Môn học</dt><dd>${esc(ev.name)}</dd>
            <dt>Ngày học</dt><dd>${DAY_NAMES[dayIndex(d)]}, ${fmtDM(d)}/${d.getFullYear()}</dd>
            <dt>Ca học</dt><dd>Ca ${c.ca} (${c.start} - ${c.end}) - Tiết ${c.tiet}</dd>
            <dt>Phòng học</dt><dd>${ev.room ? esc(ev.room) : '-'}</dd>
            <dt>Giảng viên</dt><dd>${ev.teacher ? esc(ev.teacher) : '-'}</dd>
            <dt>Trạng thái</dt><dd><span class="badge ${done ? 'done' : 'todo'}">${done ? 'Đã học' : 'Chưa học'}</span></dd>`;
        openModal(detailModal);
    }

    function askDelete(id) {
        const ev = findEvent(id);
        const c = getCa(ev.ca);
        currentId = id;
        $('confirmText').textContent = `Xóa lịch học "${ev.name}" (${fmtDM(parseISO(ev.date))}, Ca ${c.ca}: ${c.start} - ${c.end})?`;
        const n = events.filter(e => e.group && e.group === ev.group).length;
        $('deleteAllWrap').hidden = n < 2;
        $('deleteAll').checked = true;
        $('deleteAllText').textContent = `Xóa tất cả ${n} lịch lặp`;
        openModal(confirmModal);
    }

    $('confirmYes').addEventListener('click', () => {
        const ev = findEvent(currentId);
        const all = $('deleteAll').checked && ev.group;
        events = events.filter(e => all ? e.group !== ev.group : e.id !== currentId);
        saveEvents();
        closeModal(confirmModal);
        render();
    });

    $('detailEdit').addEventListener('click', () => { closeModal(detailModal); openForm({ id: currentId }); });$('detailDelete').addEventListener('click', () => { closeModal(detailModal); askDelete(currentId); });

    weekGrid.addEventListener('click', e => {
        const cell = e.target.closest('.wg-cell');
        if (!cell) return;

        const card = cell.querySelector('.ev');
        if (card) openDetail(card.dataset.id);
        else openForm({ date: cell.dataset.date, ca: cell.dataset.ca });
    });

    $('btnPrevWeek').addEventListener('click', () => goToWeekOf(addDays(weekStart, -7)));
    $('btnNextWeek').addEventListener('click', () => goToWeekOf(addDays(weekStart, 7)));$('btnAdd').addEventListener('click', () => openForm());

    $('miniPrev').addEventListener('click', () => { miniMonth = new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1, 1); renderMini(); });$('miniNext').addEventListener('click', () => {
        miniMonth = new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1, 1);
        renderMini();
    });
    miniGrid.addEventListener('click', e => {
        const b = e.target.closest('.mini-day');
        if (!b) return;
        weekStart = startOfWeek(parseISO(b.dataset.date));
        render();
    });

    render();
})();