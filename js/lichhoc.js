(function () {
    'use strict';

    const START_HOUR = 7;
    const END_HOUR = 22;
    const ROW_H = 64;
    const GRID_TOP = 10;
    const STORAGE_KEY = 'data_lh';

    const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

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
    const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

    const isDone = ev => new Date() >= new Date(`${ev.date}T${ev.end}`);

    function colorIndexFor(name) {
        let h = 0;
        for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return h % PALETTE.length;
    }

    const loadEvents = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; } };
    const saveEvents = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

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
        name: $('fName'), date: $('fDate'), start:$('fStart'),
        end: $('fEnd'), room: $('fRoom'), teacher:$('fTeacher'),
        repeat: $('fRepeat')
    };

    function renderEvent(e) {
        const top = GRID_TOP + (toMin(e.start) - START_HOUR * 60) / 60 * ROW_H + 1;
        const height = Math.max((toMin(e.end) - toMin(e.start)) / 60 * ROW_H - 2, 22);
        const p = PALETTE[colorIndexFor(e.name)];
        return `<div class="ev${isDone(e) ? ' is-done' : ''}" data-id="${e.id}"
                     style="top:${top}px;height:${height}px;--bg:${p.bg};--bd:${p.bd};--tx:${p.tx}">
                    <span class="ev-title">${esc(e.name)}</span>
                    <span class="ev-meta">${e.start} - ${e.end}</span>
                    ${e.room ? `<span class="ev-meta">${esc(e.room)}</span>` : ''}
                </div>`;
    }

    function renderWeek() {
        const todayISO = toISO(new Date());
        let heads = '', cols = '';

        for (let i = 0; i < 7; i++) {
            const d = addDays(weekStart, i);
            const iso = toISO(d);
            const today = iso === todayISO ? ' today' : '';
            heads += `<div class="wg-head${today}"><strong>${DAY_NAMES[i]}</strong><small>${fmtDM(d)}</small></div>`;
            cols += `<div class="wg-col${today}" data-date="${iso}">
                        ${events.filter(e => e.date === iso).map(renderEvent).join('')}
                     </div>`;
        }

        let times = '';
        for (let h = START_HOUR; h <= END_HOUR; h++) {
            times += `<span class="wg-time" style="top:${GRID_TOP + (h - START_HOUR) * ROW_H}px">${pad(h)}:00</span>`;
        }

        weekGrid.innerHTML = `<div class="wg-corner"></div>${heads}<div class="wg-times">${times}</div>${cols}`;
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

    const inputs = { name: [f.name], date: [f.date], time: [f.start, f.end], room: [f.room], repeat: [f.repeat] };
    function showErrors(errs = {}) {
        Object.keys(inputs).forEach(k => {
            const errEl = form.querySelector(`[data-err="${k}"]`);
            if (errEl) errEl.textContent = errs[k] || '';
            inputs[k].forEach(i => i.classList.toggle('invalid', !!errs[k]));
        });
    }

    function checkTime(date, start, end, weeks, isEditAll = false) {
        if (!start || !end) return 'Vui lòng chọn giờ bắt đầu và kết thúc';
        if (end <= start) return 'Giờ kết thúc phải sau giờ bắt đầu';
        if (toMin(end) - toMin(start) < 30) return 'Thời lượng buổi học phải từ 30 phút trở lên';
        if (toMin(start) < START_HOUR * 60 || toMin(end) > END_HOUR * 60) {
            return `Thời gian học phải trong khoảng ${pad(START_HOUR)}:00 - ${END_HOUR}:00`;
        }
        
        const ev = currentId ? findEvent(currentId) : null;
        let dates = [];
        if (isEditAll && ev && ev.group) {
            const groupEvents = events.filter(e => e.group === ev.group).sort((a, b) => new Date(a.date) - new Date(b.date));
            const baseDate = parseISO(date);
            dates = groupEvents.map((_, index) => toISO(addDays(baseDate, index * 7)));
        } else {
            dates = Array.from({ length: weeks }, (_, i) => toISO(addDays(parseISO(date), i * 7)));
        }

        for (const dStr of dates) {
            const c = events.find(e => e.id !== currentId && (!ev || e.group !== ev.group) && e.date === dStr && start < e.end && e.start < end);
            if (c) {
                return `Trùng giờ với: ${c.name} (${fmtDM(parseISO(c.date))}, ${c.start} - ${c.end})`;
            }
        }
        return '';
    }

    function openForm(opts = {}) {
        showErrors();
        currentId = opts.id || null;
        const ev = findEvent(currentId) || {};

        $('formTitle').textContent = currentId ? 'Sửa lịch học' : 'Thêm lịch học';
        $('btnSubmit').textContent = currentId ? 'Lưu thay đổi' : 'Thêm lịch';

        const today = new Date();
        const inWeek = today >= weekStart && today < addDays(weekStart, 7);

        f.name.value = ev.name || '';
        f.date.value = ev.date || opts.date || toISO(inWeek ? today : weekStart);
        f.start.value = ev.start || opts.start || '';
        f.end.value = ev.end || opts.end || '';
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
        const start = f.start.value;
        const end = f.end.value;
        const editAllCheckbox = $('editAll');
        const isEditAll = currentId && editAllCheckbox && !editAllCheckbox.hidden && editAllCheckbox.checked;
        const repeatVal = f.repeat.value.trim();
        const weeks = Number(repeatVal);

        const parsedDate = parseISO(date);
        const year = parsedDate.getFullYear();

        const errs = {
            name: name ? '' : 'Vui lòng nhập tên môn học',
            date: !date ? 'Ngày học không hợp lệ' : (year < 2000 ? 'Năm học không hợp lệ' : ''),
            time: checkTime(date, start, end, weeks, isEditAll),
            room: f.room.value.trim() ? '' : 'Vui lòng nhập phòng học',
            repeat: (!currentId && (!/^\d+$/.test(repeatVal) || weeks < 1 || weeks > 52)) ? 'Số tuần học chỉ từ 1 đến 52 tuần' : ''
        };
        showErrors(errs);
        if (Object.values(errs).some(Boolean)) return;

        const data = {
            name, date, start, end,
            room: f.room.value.trim(),
            teacher: f.teacher.value.trim()
        };

        if (currentId) {
            const ev = findEvent(currentId);
            
            if (isEditAll && ev.group) {
                const newDate = parseISO(date);
                let groupEvents = events.filter(e => e.group === ev.group);
                groupEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

                groupEvents.forEach((item, index) => {
                    item.name = data.name;
                    item.start = data.start;
                    item.end = data.end;
                    item.room = data.room;
                    item.teacher = data.teacher;

                    const newBaseDate = addDays(newDate, index * 7);
                    item.date = toISO(newBaseDate);
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
        const done = isDone(ev);
        $('detailBody').innerHTML = `
            <dt>Môn học</dt><dd>${esc(ev.name)}</dd>
            <dt>Ngày học</dt><dd>${DAY_NAMES[dayIndex(d)]}, ${fmtDM(d)}/${d.getFullYear()}</dd>
            <dt>Thời gian</dt><dd>${ev.start} - ${ev.end}</dd>
            <dt>Phòng học</dt><dd>${ev.room ? esc(ev.room) : '-'}</dd>
            <dt>Giảng viên</dt><dd>${ev.teacher ? esc(ev.teacher) : '-'}</dd>
            <dt>Trạng thái</dt><dd><span class="badge ${done ? 'done' : 'todo'}">${done ? 'Đã học' : 'Chưa học'}</span></dd>`;
        openModal(detailModal);
    }

    function askDelete(id) {
        const ev = findEvent(id);
        currentId = id;
        $('confirmText').textContent = `Xóa lịch học "${ev.name}" (${fmtDM(parseISO(ev.date))}, ${ev.start} - ${ev.end})?`;
        const n = events.filter(e => e.group && e.group === ev.group).length;
        $('deleteAllWrap').hidden = n < 2;
        $('deleteAll').checked = true;
        $('deleteAllText').textContent = `Xóa tất cả ${n} lịch lặp`;
        openModal(confirmModal);
    }

    $('confirmYes').addEventListener('click', () => {
        const ev = findEvent(currentId);
        events = events.filter(e => $('deleteAll').checked ? e.group !== ev.group : e.id !== currentId);
        saveEvents();
        closeModal(confirmModal);
        render();
    });

    $('detailEdit').addEventListener('click', () => { closeModal(detailModal); openForm({ id: currentId }); });$('detailDelete').addEventListener('click', () => { closeModal(detailModal); askDelete(currentId); });

    weekGrid.addEventListener('click', e => {
        const card = e.target.closest('.ev');
        if (card) { openDetail(card.dataset.id); return; }

        const col = e.target.closest('.wg-col');
        if (col) {
            const rect = col.getBoundingClientRect();
            const y = e.clientY - rect.top - GRID_TOP;
            if (y < 0) return;
            const hour = Math.min(Math.max(START_HOUR + Math.floor(y / ROW_H), START_HOUR), END_HOUR - 1);
            openForm({ date: col.dataset.date, start: `${pad(hour)}:00`, end: `${pad(hour + 1)}:00` });
        }
    });

    $('btnPrevWeek').addEventListener('click', () => goToWeekOf(addDays(weekStart, -7)));
    $('btnNextWeek').addEventListener('click', () => goToWeekOf(addDays(weekStart, 7)));$('btnAdd').addEventListener('click', () => openForm());

    $('miniPrev').addEventListener('click', () => { miniMonth = nativeMonthDate = new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1, 1); renderMini(); });$('miniNext').addEventListener('click', () => {
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