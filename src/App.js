import React, { useState, useEffect } from 'react';
import { Download, Printer, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

// สำหรับ QR Code ใช้ API
const generateQRCode = (text) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
};

export default function MedicineQRApp() {
  const [medicines, setMedicines] = useState([]);
  const [templates, setTemplates] = useState({
    medicineName: ['ยาพารา', 'ยาแก้ไอ', 'ยาแก้แพ้'],
    dosage: ['ครั้งละ 1 เม็ด', 'ครั้งละ 2 เม็ด', 'ครั้งละ 1 ช้อนชา'],
    timing: ['หลังอาหาร', 'ก่อนอาหาร', 'ก่อนนอน']
  });
  
  const [selectedMedicine, setSelectedMedicine] = useState({ medicineName: '', dosage: '', timing: '' });
  const [customText, setCustomText] = useState('');
  const [qrText, setQrText] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplateValue, setNewTemplateValue] = useState('');

  // โหลดข้อมูลจาก API
  useEffect(() => {
    fetchMedicines();
    fetchTemplates();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch('http://localhost/medicine-api/api.php?action=getMedicines');
      const data = await response.json();
      if (data.success) {
        setMedicines(data.data);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost/medicine-api/api.php?action=getTemplates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const addMedicine = async () => {
    if (!selectedMedicine.medicineName || !selectedMedicine.dosage || !selectedMedicine.timing) {
      alert('กรุณาเลือกข้อมูลให้ครบทุกช่อง');
      return;
    }

    const medicineText = `${selectedMedicine.medicineName} ${selectedMedicine.dosage} ${selectedMedicine.timing}`;
    
    try {
      const response = await fetch('http://localhost/medicine-api/api.php?action=addMedicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: medicineText })
      });
      const data = await response.json();
      if (data.success) {
        fetchMedicines();
        setSelectedMedicine({ medicineName: '', dosage: '', timing: '' });
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
    }
  };

  const deleteMedicine = async (id) => {
    try {
      const response = await fetch('http://localhost/medicine-api/api.php?action=deleteMedicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.success) {
        fetchMedicines();
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
    }
  };

  const updateMedicineText = async (id, newText) => {
    try {
      const response = await fetch('http://localhost/medicine-api/api.php?action=updateMedicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, text: newText })
      });
      const data = await response.json();
      if (data.success) {
        fetchMedicines();
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
    }
  };

  const addTemplate = async (category) => {
    if (!newTemplateValue.trim()) return;

    try {
      const response = await fetch('http://localhost/medicine-api/api.php?action=addTemplate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, value: newTemplateValue })
      });
      const data = await response.json();
      if (data.success) {
        fetchTemplates();
        setNewTemplateValue('');
        setEditingTemplate(null);
      }
    } catch (error) {
      console.error('Error adding template:', error);
    }
  };

  const generateFinalText = () => {
    const text = medicines.map(m => m.text).join('\n');
    setQrText(text);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = generateQRCode(qrText);
    link.download = 'medicine-qr.png';
    link.click();
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title></head>
        <body style="text-align: center; padding: 20px;">
          <h3>ข้อบ่งใช้ยา</h3>
          <pre style="text-align: left; display: inline-block;">${qrText}</pre>
          <br><br>
          <img src="${generateQRCode(qrText)}" alt="QR Code" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="container py-4" style={{ maxWidth: '1000px' }}>
      <h2 className="text-center mb-4">ระบบจัดการข้อบ่งใช้ยาและ สร้างQR Code</h2>

      {/* เลือกข้อมูล */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">เพิ่มข้อบ่งใช้ยา</h5>
          
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">ชื่อยา</label>
              <select 
                className="form-select"
                value={selectedMedicine.medicineName}
                onChange={(e) => setSelectedMedicine({...selectedMedicine, medicineName: e.target.value})}
              >
                <option value="">เลือกยา</option>
                {templates.medicineName.map((med, i) => (
                  <option key={i} value={med}>{med}</option>
                ))}
              </select>
              {editingTemplate === 'medicineName' ? (
                <div className="input-group mt-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="เพิ่มยาใหม่"
                    value={newTemplateValue}
                    onChange={(e) => setNewTemplateValue(e.target.value)}
                  />
                  <button className="btn btn-sm btn-success" onClick={() => addTemplate('medicineName')}>
                    <Save size={14} />
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingTemplate(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => setEditingTemplate('medicineName')}>
                  <Plus size={14} /> เพิ่มยา
                </button>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label">ปริมาณการกิน</label>
              <select 
                className="form-select"
                value={selectedMedicine.dosage}
                onChange={(e) => setSelectedMedicine({...selectedMedicine, dosage: e.target.value})}
              >
                <option value="">เลือกปริมาณ</option>
                {templates.dosage.map((dose, i) => (
                  <option key={i} value={dose}>{dose}</option>
                ))}
              </select>
              {editingTemplate === 'dosage' ? (
                <div className="input-group mt-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="เพิ่มปริมาณใหม่"
                    value={newTemplateValue}
                    onChange={(e) => setNewTemplateValue(e.target.value)}
                  />
                  <button className="btn btn-sm btn-success" onClick={() => addTemplate('dosage')}>
                    <Save size={14} />
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingTemplate(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => setEditingTemplate('dosage')}>
                  <Plus size={14} /> เพิ่มปริมาณ
                </button>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label">เวลา</label>
              <select 
                className="form-select"
                value={selectedMedicine.timing}
                onChange={(e) => setSelectedMedicine({...selectedMedicine, timing: e.target.value})}
              >
                <option value="">เลือกเวลา</option>
                {templates.timing.map((time, i) => (
                  <option key={i} value={time}>{time}</option>
                ))}
              </select>
              {editingTemplate === 'timing' ? (
                <div className="input-group mt-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="เพิ่มเวลาใหม่"
                    value={newTemplateValue}
                    onChange={(e) => setNewTemplateValue(e.target.value)}
                  />
                  <button className="btn btn-sm btn-success" onClick={() => addTemplate('timing')}>
                    <Save size={14} />
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingTemplate(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => setEditingTemplate('timing')}>
                  <Plus size={14} /> เพิ่มเวลา
                </button>
              )}
            </div>
          </div>

          <button className="btn btn-primary mt-3 w-100" onClick={addMedicine}>
            <Plus size={18} /> เพิ่มข้อบ่งใช้
          </button>
        </div>
      </div>

      {/* แสดงรายการยา */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">รายการข้อบ่งใช้ยา</h5>
          {medicines.length === 0 ? (
            <p className="text-muted">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="list-group">
              {medicines.map((med) => (
                <MedicineItem 
                  key={med.id} 
                  medicine={med} 
                  onDelete={deleteMedicine}
                  onUpdate={updateMedicineText}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* สร้าง QR Code */}
      {medicines.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body text-center">
            <button className="btn btn-success btn-lg mb-3" onClick={generateFinalText}>
              สร้าง QR Code
            </button>

            {qrText && (
              <div>
                <div className="mb-3 p-3 bg-light rounded">
                  <pre className="mb-0" style={{ textAlign: 'left', fontSize: '14px' }}>{qrText}</pre>
                </div>
                <img src={generateQRCode(qrText)} alt="QR Code" className="mb-3" style={{ maxWidth: '300px' }} />
                <div>
                  <button className="btn btn-primary me-2" onClick={downloadQR}>
                    <Download size={18} /> ดาวน์โหลด
                  </button>
                  <button className="btn btn-secondary" onClick={printQR}>
                    <Printer size={18} /> พิมพ์
                  </button>
                </div>
              </div>
            )}
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

  const handleSave = () => {
    onUpdate(medicine.id, editText);
    setIsEditing(false);
  };

  return (
    <div className="list-group-item d-flex justify-content-between align-items-center">
      {isEditing ? (
        <input
          type="text"
          className="form-control me-2"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
        />
      ) : (
        <span>{medicine.text}</span>
      )}
      <div>
        {isEditing ? (
          <>
            <button className="btn btn-sm btn-success me-1" onClick={handleSave}>
              <Save size={16} />
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(false)}>
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} />
            </button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(medicine.id)}>
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}