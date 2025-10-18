import React, { useState, useEffect } from 'react';
import { Download, Printer, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// สำหรับ QR Code ใช้ API (ไม่ต้องแก้)
const generateQRCode = (text) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`;
};

export default function MedicineQRApp() {
  const [medicines, setMedicines] = useState([]);
  const [templates, setTemplates] = useState({
    medicineName: ['ยาพารา', 'ยาแก้ไอ', 'ยาแก้แพ้'],
    dosage: ['1 เม็ด', '2 เม็ด', '3 เม็ด'],
    timing: ['หลังอาหาร', 'ก่อนอาหาร',]
  });
  
  const [selectedValues, setSelectedValues] = useState({});
  const [qrCodes, setQrCodes] = useState([]);
  const [editingTemplateCategory, setEditingTemplateCategory] = useState(null);
  const [newTemplateValue, setNewTemplateValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // โหลดข้อมูลจาก localStorage เมื่อเปิดแอพ
  useEffect(() => {
    const savedMedicines = localStorage.getItem('medicines');
    const savedTemplates = localStorage.getItem('templates');
    
    if (savedMedicines) {
      setMedicines(JSON.parse(savedMedicines));
    }
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // บันทึกยาลง localStorage ทุกครั้งที่มีการเปลี่ยนแปลง
  const updateMedicinesStorage = (newMedicines) => {
    setMedicines(newMedicines);
    localStorage.setItem('medicines', JSON.stringify(newMedicines));
  };

  // บันทึก templates ลง localStorage
  const updateTemplatesStorage = (newTemplates) => {
    setTemplates(newTemplates);
    localStorage.setItem('templates', JSON.stringify(newTemplates));
  };

  // เพิ่มยา (อนุญาตให้มี 1 ค่าก็ได้)
  const addMedicine = () => {
    const values = Object.values(selectedValues).filter(v => v);
    
    if (values.length === 0) {
      alert('กรุณาเลือกข้อมูลอย่างน้อย 1 รายการ');
      return;
    }

    const medicineText = values.join(' ');
    const newMedicine = {
      id: Date.now(),
      text: medicineText,
      createdAt: new Date().toISOString()
    };

    updateMedicinesStorage([newMedicine, ...medicines]);
    setSelectedValues({});
  };

  // ลบยา
  const deleteMedicine = (id) => {
    setDeleteConfirm(id);
  };

  // ยืนยันการลบ
  const confirmDelete = () => {
    if (deleteConfirm) {
      updateMedicinesStorage(medicines.filter(m => m.id !== deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  // แก้ไขยา
  const updateMedicine = (id, newText) => {
    updateMedicinesStorage(
      medicines.map(m => m.id === id ? { ...m, text: newText } : m)
    );
  };

  // เพิ่ม template ใหม่
  const addTemplate = (category) => {
    if (!newTemplateValue.trim()) {
      alert('กรุณาใส่ข้อมูล');
      return;
    }

    const newTemplates = {
      ...templates,
      [category]: [...(templates[category] || []), newTemplateValue]
    };

    updateTemplatesStorage(newTemplates);
    setNewTemplateValue('');
    setEditingTemplateCategory(null);
  };

  // สร้าง QR Code สำหรับแต่ละรายการ
  const generateQRCodes = () => {
    if (medicines.length === 0) {
      alert('ไม่มีรายการยา');
      return;
    }

    const codes = medicines.map((medicine, index) => ({
      id: medicine.id,
      text: medicine.text,
      qrUrl: generateQRCode(medicine.text),
      index: index + 1
    }));

    setQrCodes(codes);
  };

  // ดาวน์โหลด QR Code เป็น ZIP
  const downloadAllQR = async () => {
    if (qrCodes.length === 0) return;

    const zip = new JSZip();

    try {
      for (let i = 0; i < qrCodes.length; i++) {
        const qr = qrCodes[i];
        const response = await fetch(qr.qrUrl);
        const blob = await response.blob();
        zip.file(`medicine-qr-${i + 1}.png`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'medicine-qr-codes.zip');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด');
    }
  };

  // พิมพ์ QR Code ทั้งหมด
  const printAllQR = () => {
    if (qrCodes.length === 0) return;

    const printWindow = window.open('', '_blank');
    const content = qrCodes.map((qr) => `
      <div style="page-break-after: always; padding: 30px; text-align: center;">
        <h2>ข้อบ่งใช้ยาที่ ${qr.index}</h2>
        <p style="font-size: 18px; margin: 30px 0; line-height: 1.8;">${qr.text}</p>
        <img src="${qr.qrUrl}" alt="QR Code" style="max-width: 400px; margin: 30px 0;" />
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>พิมพ์ QR Code</title>
          <style>
            body { font-family: 'Sarabun', Arial, sans-serif; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ดาวน์โหลด QR เดี่ยว
  const downloadSingleQR = (qr) => {
    const link = document.createElement('a');
    link.href = qr.qrUrl;
    link.download = `medicine-qr-${qr.index}.png`;
    link.click();
  };

  return (
    <div className="container py-4" style={{ maxWidth: '1200px' }}>
      <h1 className="text-center mb-2">ระบบจัดการข้อบ่งใช้ยาและ สร้างQR Code</h1>


      {/* ฟอร์มเพิ่มยา */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">➕ เพิ่มข้อบ่งใช้ยา</h5>
          
          <div className="row g-3 mb-3">
            {Object.entries(templates).map(([category, values]) => (
              <div key={category} className="col-md-4">
                <label className="form-label text-capitalize fw-bold">
                  {category === 'medicineName' && '🩹 ชื่อยา'}
                  {category === 'dosage' && '📊 ปริมาณการกิน'}
                  {category === 'timing' && '⏰ เวลา'}
                </label>
                <select 
                  className="form-select"
                  value={selectedValues[category] || ''}
                  onChange={(e) => setSelectedValues({...selectedValues, [category]: e.target.value})}
                >
                  <option value="">-- เลือก --</option>
                  {values.map((item, i) => (
                    <option key={i} value={item}>{item}</option>
                  ))}
                </select>

                {editingTemplateCategory === category ? (
                  <div className="input-group mt-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="เพิ่มรายการใหม่"
                      value={newTemplateValue}
                      onChange={(e) => setNewTemplateValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTemplate(category)}
                    />
                    <button className="btn btn-sm btn-success" onClick={() => addTemplate(category)}>
                      <Save size={14} />
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => setEditingTemplateCategory(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-sm btn-outline-primary mt-2 w-100"
                    onClick={() => setEditingTemplateCategory(category)}
                  >
                    <Plus size={14} />เพิ่มรายการใหม่
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="btn btn-success w-100 btn-lg" onClick={addMedicine}>
            เพิ่มข้อบ่งใช้ยา
          </button>
        </div>
      </div>

      {/* รายการยา */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">📋 รายการข้อบ่งใช้ยา ({medicines.length})</h5>
          {medicines.length === 0 ? (
            <p className="text-muted text-center py-3">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="list-group">
              {medicines.map((med) => (
                <MedicineItem 
                  key={med.id} 
                  medicine={med} 
                  onDelete={deleteMedicine}
                  onUpdate={updateMedicine}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* สร้าง QR Code */}
      {medicines.length > 0 && (
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3"> สร้าง QR Code</h5>
            
            <button
              className="btn btn-success btn-lg w-100 mb-3"
              onClick={generateQRCodes}
            >
              ✓ สร้าง QR Code ({medicines.length} รายการ)
            </button>

            {qrCodes.length > 0 && (
              <>
                <div className="d-flex gap-2 mb-4">
                  <button
                    className="btn btn-primary flex-grow-1"
                    onClick={downloadAllQR}
                  >
                    <Download size={18} /> ดาวน์โหลด ZIP ทั้งหมด
                  </button>
                  <button
                    className="btn btn-secondary flex-grow-1"
                    onClick={printAllQR}
                  >
                    <Printer size={18} /> พิมพ์ทั้งหมด
                  </button>
                </div>

                <div className="row g-3">
                  {qrCodes.map((qr) => (
                    <div key={qr.id} className="col-md-6 col-lg-4">
                      <div className="card border-light">
                        <div className="card-body text-center">
                          <h6 className="card-title">รายการที่ {qr.index}</h6>
                          <p className="text-muted small mb-2">{qr.text}</p>
                          <img
                            src={qr.qrUrl}
                            alt="QR Code"
                            className="img-fluid mb-2"
                            style={{ maxWidth: '200px' }}
                          />
                          <button
                            className="btn btn-sm btn-outline-primary w-100"
                            onClick={() => downloadSingleQR(qr)}
                          >
                            <Download size={14} /> ดาวน์โหลด
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="card" style={{ width: '300px' }}>
            <div className="card-body">
              <h5 className="card-title">ยืนยันการลบ</h5>
              <p className="text-muted">ต้องการลบรายการนี้จริงหรือ?</p>
              <div className="d-flex gap-2">
                <button className="btn btn-danger flex-grow-1" onClick={confirmDelete}>
                  ลบ
                </button>
                <button className="btn btn-secondary flex-grow-1" onClick={() => setDeleteConfirm(null)}>
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
    </div>
  );
}

function MedicineItem({ medicine, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(medicine.text);
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(medicine.id, editText);
      setIsEditing(false);
    }
  };

  return (
    <div className="list-group-item d-flex justify-content-between align-items-center p-3">
      {isEditing ? (
        <input
          type="text"
          className="form-control me-2"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      ) : (
        <span className="flex-grow-1">{medicine.text}</span>
      )}
      <div className="btn-group ms-2">
        {isEditing ? (
          <>
            <button className="btn btn-sm btn-success" onClick={handleSave}>
              <Save size={16} />
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(false)}>
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <button 
              className="btn btn-sm btn-outline-primary" 
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={16} />
            </button>
            <button 
              className="btn btn-sm btn-outline-danger" 
              onClick={() => onDelete(medicine.id)}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}