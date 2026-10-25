const KHOA_LUU = 'danhSachTB_Data';

let danhSachTB = docDanhSach();
let itemDangChon = null;
let tabHienTai = 'tatca';

function docDanhSach() {
    try {
        return JSON.parse(localStorage.getItem(KHOA_LUU)) || [];
    } catch (e) {
        return [];
    }
}

function luuDanhSach() {
    localStorage.setItem(KHOA_LUU, JSON.stringify(danhSachTB));
}

function ngayHomNay() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function dinhDangNgay(iso) {
    const parts = iso.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}

function taoItem(tb) {
    const daDoc = tb.trangthai === 'dadoc';

    const item = document.createElement('div');
    item.className = `itemthongbao ${tb.trangthai}`;
    item.dataset.id = tb.id;
    item.dataset.title = tb.tieude;
    item.dataset.time = `${tb.ngay} - 08:00`;
    item.dataset.content = tb.noidung;

    const noiDungItem = document.createElement('div');
    noiDungItem.className = 'noidungitem';

    if (!daDoc) {
        const cham = document.createElement('div');
        cham.className = 'chamchuadoc';
        noiDungItem.appendChild(cham);
    }

    const textItem = document.createElement('div');
    textItem.className = 'textitem';
    if (daDoc) textItem.style.paddingLeft = '18px';

    const h4 = document.createElement('h4');
    h4.textContent = tb.tieude;
    const p = document.createElement('p');
    p.textContent = tb.noidung;
    textItem.append(h4, p);
    noiDungItem.appendChild(textItem);

    const thongTinPhu = document.createElement('div');
    thongTinPhu.className = 'thongtinphu';

    const ngay = document.createElement('span');
    ngay.className = 'ngaythang';
    ngay.textContent = tb.ngay;

    const nhan = document.createElement('span');
    nhan.className = daDoc ? 'nhandandadoc' : 'nhandanchuadoc';
    nhan.textContent = daDoc ? 'Đã đọc' : 'Chưa đọc';

    thongTinPhu.append(ngay, nhan);
    item.append(noiDungItem, thongTinPhu);
    return item;
}

function hienThiChiTiet(item) {
    document.getElementById('tieudecitiet').textContent = item.dataset.title;
    document.getElementById('ngaygiochitiet').textContent = item.dataset.time;
    document.getElementById('noidungchitiet').textContent = item.dataset.content;

    document.querySelectorAll('.itemthongbao').forEach(el => el.classList.remove('dang-chon'));
    item.classList.add('dang-chon');
    itemDangChon = item;

    danhDauDaDoc(item);
}

function danhDauDaDoc(item) {
    if (!item || !item.classList.contains('chuadoc')) return;

    item.classList.remove('chuadoc');
    item.classList.add('dadoc');

    const cham = item.querySelector('.chamchuadoc');
    if (cham) cham.remove();

    const textItem = item.querySelector('.textitem');
    if (textItem) textItem.style.paddingLeft = '18px';

    const nhan = item.querySelector('.nhandanchuadoc');
    if (nhan) {
        nhan.className = 'nhandandadoc';
        nhan.textContent = 'Đã đọc';
    }

    const found = danhSachTB.find(tb => tb.id === item.dataset.id);
    if (found) {
        found.trangthai = 'dadoc';
        luuDanhSach();
    }

    capNhatSoLuongTab();
    locTheoTab(tabHienTai);
}

function locTheoTab(loai) {
    tabHienTai = loai;

    document.querySelectorAll('.nutloc').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === loai);
    });

    document.querySelectorAll('.itemthongbao').forEach(item => {
        const hienThi = loai === 'tatca' || item.classList.contains(loai);
        item.style.display = hienThi ? 'flex' : 'none';
    });
}

function capNhatSoLuongTab() {
    const tongTatCa = document.querySelectorAll('.itemthongbao').length;
    const tongChuaDoc = document.querySelectorAll('.itemthongbao.chuadoc').length;
    const tongDaDoc = document.querySelectorAll('.itemthongbao.dadoc').length;

    const nhan = {
        tatca: `Tất cả (${tongTatCa})`,
        chuadoc: `Chưa đọc (${tongChuaDoc})`,
        dadoc: `Đã đọc (${tongDaDoc})`
    };

    document.querySelectorAll('.nutloc').forEach(btn => {
        btn.textContent = nhan[btn.dataset.tab];
    });
}

function renderThongBaoDyna() {
    const container = document.querySelector('.danhsachitem');
    if (!container) return;

    danhSachTB.forEach(tb => container.prepend(taoItem(tb)));
    capNhatSoLuongTab();
}

document.addEventListener('DOMContentLoaded', () => {
    renderThongBaoDyna();

    const container = document.querySelector('.danhsachitem');
    const thanhLoc = document.querySelector('.thanhboloc');
    const nutDaDoc = document.getElementById('nutDanhDauDaDoc');

    if (container) {
        container.addEventListener('click', e => {
            const item = e.target.closest('.itemthongbao');
            if (item) hienThiChiTiet(item);
        });
    }

    if (thanhLoc) {
        thanhLoc.addEventListener('click', e => {
            const btn = e.target.closest('.nutloc');
            if (btn) locTheoTab(btn.dataset.tab);
        });
    }

    if (nutDaDoc) {
        nutDaDoc.addEventListener('click', () => danhDauDaDoc(itemDangChon));
    }

    const modalEl = document.getElementById('modalThemTB');
    const formEl = document.getElementById('formThemTB');
    const nutMoModal = document.getElementById('nutMoModal');
    const nutDongModal = document.getElementById('nutDongModal');
    const nutHuyModal = document.getElementById('nutHuyModal');

    const moModal = () => {
        if (!modalEl) return;
        modalEl.hidden = false;
        const nhapNgay = document.getElementById('nhapNgay');
        if (nhapNgay) nhapNgay.value = ngayHomNay();
    };

    const dongModal = () => {
        if (modalEl) modalEl.hidden = true;
        if (formEl) formEl.reset();
    };

    if (nutMoModal) nutMoModal.addEventListener('click', moModal);
    if (nutDongModal) nutDongModal.addEventListener('click', dongModal);
    if (nutHuyModal) nutHuyModal.addEventListener('click', dongModal);

    if (modalEl) {
        modalEl.addEventListener('click', e => {
            if (e.target === modalEl) dongModal();
        });
    }

    if (formEl) {
        formEl.addEventListener('submit', e => {
            e.preventDefault();

            const tieude = document.getElementById('nhapTieuDe').value.trim();
            const noidung = document.getElementById('nhapNoiDung').value.trim();
            const ngayRaw = document.getElementById('nhapNgay').value || ngayHomNay();

            if (!tieude || !noidung) return;

            const thongBaoMoi = {
                id: String(Date.now()),
                tieude,
                noidung,
                ngay: dinhDangNgay(ngayRaw),
                trangthai: 'chuadoc'
            };

            danhSachTB.push(thongBaoMoi);
            luuDanhSach();

            if (container) container.prepend(taoItem(thongBaoMoi));
            capNhatSoLuongTab();
            locTheoTab(tabHienTai);

            dongModal();
        });
    }
});