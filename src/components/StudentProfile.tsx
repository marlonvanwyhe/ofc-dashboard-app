import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  ArrowLeft,
  Upload,
  Pencil,
  Check,
  X,
  FileText,
  Download,
  DollarSign,
} from 'lucide-react';
import { User, Group, AttendanceRecord, Invoice } from '../types';

interface StudentProfileProps {
  students: User[];
  groups: Group[];
  teachers: User[];
  attendanceRecords: AttendanceRecord[];
  invoices: Invoice[];
  onUpdateStudent: (student: User) => void;
}

export default function StudentProfile({
  students,
  groups,
  teachers,
  attendanceRecords,
  invoices,
  onUpdateStudent,
}: StudentProfileProps) {
  const { id } = useParams<{ id: string }>();
  const student = students.find((s) => s.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<User | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Student Not Found</h2>
          <Link
            to="/students"
            className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  const studentGroup = groups.find((g) => g.students.includes(student.id));
  const studentTeacher = studentGroup
    ? teachers.find((t) => t.id === studentGroup.teacherId)
    : null;

  const studentAttendance = attendanceRecords
    .filter((record) => record.records.some((r) => r.studentId === student.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const studentInvoices = invoices
    .filter((invoice) => invoice.studentId === student.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const attendanceStats = studentAttendance.reduce(
    (acc, record) => {
      const studentRecord = record.records.find((r) => r.studentId === student.id);
      if (studentRecord?.present) {
        acc.present += 1;
      } else {
        acc.absent += 1;
      }
      return acc;
    },
    { present: 0, absent: 0 }
  );

  const handleEditClick = () => {
    setEditedStudent(student);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedStudent(null);
    setIsEditing(false);
    setPreviewImage(null);
  };

  const handleSaveEdit = () => {
    if (editedStudent) {
      onUpdateStudent({
        ...editedStudent,
        image: previewImage || editedStudent.image,
      });
      setIsEditing(false);
      setPreviewImage(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadInvoice = (invoice: Invoice) => {
    let invoiceHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .invoice-details { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
          </div>
          <div class="invoice-details">
            <p><strong>Invoice #:</strong> ${invoice.id}</p>
            <p><strong>Date:</strong> ${format(new Date(invoice.createdAt), 'PPP')}</p>
            <p><strong>Due Date:</strong> ${format(new Date(invoice.dueDate), 'PPP')}</p>
            <p><strong>Student:</strong> ${student.name}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.amount.toFixed(2)}</td>
                  <td>$${(item.amount * item.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total Amount: $${invoice.amount.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/students"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Link>
        {!isEditing ? (
          <button
            onClick={handleEditClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center mb-6">
              {isEditing ? (
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-2">
                    {(previewImage || editedStudent?.image) ? (
                      <img
                        src={previewImage || editedStudent?.image}
                        alt={editedStudent?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <GraduationCap className="w-16 h-16 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg mt-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <>
                  {student.image ? (
                    <img
                      src={student.image}
                      alt={student.name}
                      className="w-32 h-32 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <GraduationCap className="w-16 h-16 text-blue-600" />
                    </div>
                  )}
                </>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editedStudent?.name || ''}
                  onChange={(e) =>
                    setEditedStudent(prev => prev ? { ...prev, name: e.target.value } : null)
                  }
                  className="text-2xl font-bold text-center border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-center">{student.name}</h1>
              )}
              {studentGroup && (
                <span className="text-sm text-gray-600">{studentGroup.name}</span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                {isEditing ? (
                  <input
                    type="email"
                    value={editedStudent?.email || ''}
                    onChange={(e) =>
                      setEditedStudent(prev => prev ? { ...prev, email: e.target.value } : null)
                    }
                    className="flex-1 border-b border-gray-200 focus:border-blue-500 outline-none"
                  />
                ) : (
                  <span>{student.email}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedStudent?.phone || ''}
                    onChange={(e) =>
                      setEditedStudent(prev => prev ? { ...prev, phone: e.target.value } : null)
                    }
                    className="flex-1 border-b border-gray-200 focus:border-blue-500 outline-none"
                  />
                ) : (
                  <span>{student.phone || 'No phone number'}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editedStudent?.address || ''}
                    onChange={(e) =>
                      setEditedStudent(prev => prev ? { ...prev, address: e.target.value } : null)
                    }
                    className="flex-1 border-b border-gray-200 focus:border-blue-500 outline-none"
                  />
                ) : (
                  <span>{student.address || 'No address'}</span>
                )}
              </div>
              {studentTeacher && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>Teacher: {studentTeacher.name}</span>
                </div>
              )}
            </div>

            {(student.guardianName || student.guardianContact || isEditing) && (
              <div className="mt-6 pt-6 border-t">
                <h2 className="text-lg font-semibold mb-4">Guardian Information</h2>
                <div className="space-y-4">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedStudent?.guardianName || ''}
                        onChange={(e) =>
                          setEditedStudent(prev => prev ? { ...prev, guardianName: e.target.value } : null)
                        }
                        placeholder="Guardian Name"
                        className="w-full border-b border-gray-200 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      student.guardianName && (
                        <p className="text-gray-600 mb-2">{student.guardianName}</p>
                      )
                    )}
                  </div>
                  <div>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedStudent?.guardianContact || ''}
                        onChange={(e) =>
                          setEditedStudent(prev => prev ? { ...prev, guardianContact: e.target.value } : null)
                        }
                        placeholder="Guardian Contact"
                        className="w-full border-b border-gray-200 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      student.guardianContact && (
                        <p className="text-gray-600">{student.guardianContact}</p>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Attendance Overview</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 text-2xl font-bold">
                  {attendanceStats.present}
                </div>
                <div className="text-green-800">Present</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-red-600 text-2xl font-bold">
                  {attendanceStats.absent}
                </div>
                <div className="text-red-800">Absent</div>
              </div>
            </div>

            <h3 className="font-semibold mb-4">Recent Attendance</h3>
            <div className="space-y-3">
              {studentAttendance.slice(0, 5).map((record) => {
                const studentRecord = record.records.find(
                  (r) => r.studentId === student.id
                );
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span>{format(new Date(record.date), 'PPP')}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        studentRecord?.present
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {studentRecord?.present ? 'Present' : 'Absent'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Invoices</h2>
              <Link
                to="/invoices"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All Invoices
              </Link>
            </div>
            <div className="space-y-4">
              {studentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Invoice #{invoice.id}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {format(new Date(invoice.dueDate), 'PP')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${invoice.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                    <button
                      onClick={() => downloadInvoice(invoice)}
                      className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {studentInvoices.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No invoices found for this student
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}