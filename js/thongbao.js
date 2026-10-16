let currentSelectedItem = null;
let danhSachTB = JSON.parse(localStorage.getItem('danhSachTB_Data')) || [];

function hienThiChiTiet(tieuDe, ngayGio, noiDung, element) {
    document.getElementById('tieudecitiet').innerText = tieuDe;
    document.getElementById('ngaygiochitiet').innerText = ngayGio;
    document.getElementById('noidungchitiet').innerHTML = noiDung;
    
    document.querySelectorAll('.itemthongbao').forEach(el => el.classList.remove('dang-chon'));
    if (element) {
        element.classList.add('dang-chon');
    }
    currentSelectedItem = element;

    if (element && element.classList.contains('chuadoc')) {
        element.classList.remove('chuadoc');
        element.classList.add('dadoc');
        
        let cham = element.querySelector('.chamchuadoc');
        if (cham) cham.style.display = 'none'; // Ẩn chấm đỏ
        
        let textItem = element.querySelector('.textitem');
        if (textItem) textItem.style.paddingLeft = '18px'; // Căn lề giống các mục đã đọc sẵn

        let nhanDan = element.querySelector('.nhandanchuadoc');
        if (nhanDan) {
            nhanDan.className = 'nhandandadoc';
            nhanDan.innerText = 'Đã đọc';
        }

        const found = danhSachTB.find(tb => tb.tieude === tieuDe);
        if (found) {
            found.trangthai = 'dadoc';
            localStorage.setItem('danhSachTB_Data', JSON.stringify(danhSachTB));
        }

        capNhatSoLuongTab();
    }
}

function danhDauDaDoc() {
    if (currentSelectedItem) {
        if (currentSelectedItem.classList.contains('chuadoc')) {
            currentSelectedItem.classList.remove('chuadoc');
            currentSelectedItem.classList.add('dadoc');
            
            let cham = currentSelectedItem.querySelector('.chamchuadoc');
            if (cham) cham.style.display = 'none';
            
            let textItem = currentSelectedItem.querySelector('.textitem');
            if (textItem) textItem.style.paddingLeft = '18px';

            let nhanDan = currentSelectedItem.querySelector('.nhandanchuadoc');
            if (nhanDan) {
                nhanDan.className = 'nhandandadoc';
                nhanDan.innerText = 'Đã đọc';
            }

            const tieuDeHienTai = document.getElementById('tieudecitiet').innerText;
            const found = danhSachTB.find(tb => tb.tieude === tieuDeHienTai);
            if (found) {
                found.trangthai = 'dadoc';
                localStorage.setItem('danhSachTB_Data', JSON.stringify(danhSachTB));
            }

            capNhatSoLuongTab();
        }
    }
}

function chuyenTab(loai, event) {
    let buttons = document.querySelectorAll('.nutloc');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    let items = document.querySelectorAll('.itemthongbao');
    items.forEach(item => {
        if (loai === 'tatca') {
            item.style.display = 'flex';
        } else if (loai === 'chuadoc') {
            if (item.classList.contains('chuadoc')) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        } else if (loai === 'dadoc') {
            if (item.classList.contains('dadoc')) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        }
    });
}

function capNhatSoLuongTab() {
    const tongTatCa = document.querySelectorAll('.itemthongbao').length;
    const tongChuaDoc = document.querySelectorAll('.itemthongbao.chuadoc').length;
    const tongDaDoc = document.querySelectorAll('.itemthongbao.dadoc').length;

    const nutLocs = document.querySelectorAll('.nutloc');
    if(nutLocs.length >= 3) {
        nutLocs[0].innerText = `Tất cả (${tongTatCa})`;
        nutLocs[1].innerText = `Chưa đọc (${tongChuaDoc})`;
        nutLocs[2].innerText = `Đã đọc (${tongDaDoc})`;
    }
}

function renderThongBaoDyna() {
    const danhSachContainer = document.querySelector('.danhsachitem');
    if (!danhSachContainer) return;

    danhSachTB.forEach(tb => {
        const divItem = document.createElement('div');
        divItem.className = `itemthongbao ${tb.trangthai}`;
        divItem.setAttribute('onclick', `hienThiChiTiet(escapeHtml('${tb.tieude}'), '${tb.ngay} - 08:00', escapeHtml('${tb.noidung}'), this)`);
        
        divItem.innerHTML = `
            <div class="noidungitem">
                ${tb.trangthai === 'chuadoc' ? '<div class="chamchuadoc"></div>' : ''}
                <div class="textitem" ${tb.trangthai === 'dadoc' ? 'style="padding-left: 18px;"' : ''}>
                    <h4>${tb.tieude}</h4>
                    <p>${tb.noidung}</p>
                </div>
            </div>
            <div class="thongtinphu">
                <span class="ngaythang">${tb.ngay}</span>
                <span class="${tb.trangthai === 'chuadoc' ? 'nhandanchuadoc' : 'nhandandadoc'}">
                    ${tb.trangthai === 'chuadoc' ? 'Chưa đọc' : 'Đã đọc'}
                </span>
            </div>
        `;
        danhSachContainer.prepend(divItem);
    });
    capNhatSoLuongTab();
}

function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
    renderThongBaoDyna();

    const modalEl = document.getElementById('modalThemTB');
    const formEl = document.getElementById('formThemTB');
    const nutMoModal = document.getElementById('nutMoModal');
    const nutDongModal = document.getElementById('nutDongModal');
    const nutHuyModal = document.getElementById('nutHuyModal');

    const moModal = () => { 
        if (modalEl) {
            modalEl.hidden = false; 
            const nhapNgay = document.getElementById('nhapNgay');
            if (nhapNgay) {
                nhapNgay.value = new Date().toISOString().split('T')[0];
            }
        }
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
            const ngayRaw = document.getElementById('nhapNgay').value;

            let ngayFormatted = ngayRaw;
            if (ngayRaw) {
                const parts = ngayRaw.split('-');
                if (parts.length === 3) {
                    ngayFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }

            const thongBaoMoi = {
                id: String(Date.now()),
                tieude,
                noidung,
                ngay: ngayFormatted || '06/10/2026',
                trangthai: 'chuadoc'
            };

            danhSachTB.push(thongBaoMoi);
            localStorage.setItem('danhSachTB_Data', JSON.stringify(danhSachTB));
            
            dongModal();
            location.reload();
        });
    }
});