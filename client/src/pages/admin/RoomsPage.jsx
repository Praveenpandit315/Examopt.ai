// client/src/pages/admin/RoomsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  DoorOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Building, 
  Layers, 
  CheckCircle2, 
  CalendarOff,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';

export function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buildingFilter, setBuildingFilter] = useState('All Buildings');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isUnavailModalOpen, setIsUnavailModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [roomFormData, setRoomFormData] = useState({
    code: '',
    building: 'Block A',
    room_name: '',
    room_type: 'classroom',
    capacity: 60,
    is_active: 1
  });

  const [unavailFormData, setUnavailFormData] = useState({
    date: '2025-04-18',
    start_time: '12:00',
    end_time: '16:00',
    reason: 'Facility Maintenance'
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await api.rooms.getAll({
        building: buildingFilter !== 'All Buildings' ? buildingFilter : undefined,
        room_type: typeFilter !== 'All Types' ? typeFilter : undefined
      });
      setRooms(data.rooms || []);
    } catch (err) {
      setToast({ message: 'Failed to load rooms: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [buildingFilter, typeFilter]);

  const handleOpenCreateRoom = () => {
    setSelectedRoom(null);
    setRoomFormData({
      code: `R${Math.floor(100 + Math.random() * 900)}`,
      building: 'Block A',
      room_name: 'Lecture Hall',
      room_type: 'classroom',
      capacity: 80,
      is_active: 1
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room) => {
    setSelectedRoom(room);
    setRoomFormData({
      code: room.code,
      building: room.building,
      room_name: room.room_name,
      room_type: room.room_type,
      capacity: room.capacity,
      is_active: room.is_active
    });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      if (selectedRoom) {
        await api.rooms.update(selectedRoom.id, roomFormData);
        setToast({ message: `Room ${roomFormData.code} updated successfully`, type: 'success' });
      } else {
        await api.rooms.create(roomFormData);
        setToast({ message: `Room ${roomFormData.code} created successfully`, type: 'success' });
      }
      setIsRoomModalOpen(false);
      fetchRooms();
    } catch (err) {
      setToast({ message: err.message || 'Operation failed', type: 'error' });
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Delete room ${room.code}? Any scheduled exams will lose room assignment.`)) return;
    try {
      await api.rooms.delete(room.id);
      setToast({ message: `Room ${room.code} deleted`, type: 'success' });
      fetchRooms();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete room', type: 'error' });
    }
  };

  const handleOpenUnavail = (room) => {
    setSelectedRoom(room);
    setIsUnavailModalOpen(true);
  };

  const handleAddUnavail = async (e) => {
    e.preventDefault();
    try {
      await api.rooms.addUnavailability({
        room_id: selectedRoom.id,
        ...unavailFormData
      });
      setToast({ message: `Unavailability block added for ${selectedRoom.code}`, type: 'success' });
      setIsUnavailModalOpen(false);
      fetchRooms();
    } catch (err) {
      setToast({ message: err.message || 'Failed to add block', type: 'error' });
    }
  };

  const handleDeleteUnavail = async (unavailId) => {
    try {
      await api.rooms.deleteUnavailability(unavailId);
      setToast({ message: 'Unavailability block removed', type: 'success' });
      fetchRooms();
    } catch (err) {
      setToast({ message: err.message || 'Failed to remove block', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examination Rooms</h1>
          <p className="text-xs text-slate-500 mt-1">Configure physical venues, seating capacities, and unavailability blocks.</p>
        </div>

        <button
          onClick={handleOpenCreateRoom}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Room</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option>All Buildings</option>
            <option>Block A</option>
            <option>Block B</option>
            <option>Block C</option>
            <option>Main Admin</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option>All Types</option>
            <option value="classroom">Classroom</option>
            <option value="computer_lab">Computer Lab</option>
            <option value="specialized">Specialized</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Total Rooms: <span className="font-bold text-slate-800">{rooms.length}</span>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{room.code}</span>
                    {room.room_type === 'computer_lab' ? (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Computer Lab
                      </span>
                    ) : room.room_type === 'specialized' ? (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Specialized
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Classroom
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">{room.room_name}</div>
                  <div className="text-[11px] text-slate-400">{room.building}</div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-slate-900">{room.capacity}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Seats</div>
                </div>
              </div>

              {/* Unavailability Blocks List */}
              {room.unavailability?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                    <CalendarOff className="w-3 h-3" />
                    <span>Unavailable Periods ({room.unavailability.length})</span>
                  </div>
                  {room.unavailability.map((u) => (
                    <div key={u.id} className="p-2 rounded-lg bg-rose-50/70 border border-rose-100 text-[11px] text-rose-900 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{u.date} ({u.start_time} - {u.end_time})</div>
                        <div className="text-[10px] text-rose-700">{u.reason}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteUnavail(u.id)}
                        className="text-rose-400 hover:text-rose-700 p-1"
                        title="Remove block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleOpenUnavail(room)}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <CalendarOff className="w-3.5 h-3.5" />
                <span>Block Period</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEditRoom(room)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition"
                  title="Edit Room"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteRoom(room)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition"
                  title="Delete Room"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Room Modal */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title={selectedRoom ? `Edit Room ${selectedRoom.code}` : 'Add New Room'}
      >
        <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room Code</label>
              <input
                type="text"
                required
                value={roomFormData.code}
                onChange={(e) => setRoomFormData({ ...roomFormData, code: e.target.value })}
                placeholder="R101"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Building</label>
              <input
                type="text"
                required
                value={roomFormData.building}
                onChange={(e) => setRoomFormData({ ...roomFormData, building: e.target.value })}
                placeholder="Block A"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Room Name / Label</label>
            <input
              type="text"
              required
              value={roomFormData.room_name}
              onChange={(e) => setRoomFormData({ ...roomFormData, room_name: e.target.value })}
              placeholder="Lecture Hall 101"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room Type</label>
              <select
                value={roomFormData.room_type}
                onChange={(e) => setRoomFormData({ ...roomFormData, room_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="classroom">Classroom</option>
                <option value="computer_lab">Computer Lab</option>
                <option value="specialized">Specialized</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Effective Capacity (Seats)</label>
              <input
                type="number"
                min="10"
                max="500"
                required
                value={roomFormData.capacity}
                onChange={(e) => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRoomModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30"
            >
              Save Room
            </button>
          </div>
        </form>
      </Modal>

      {/* Unavailability Modal */}
      <Modal
        isOpen={isUnavailModalOpen}
        onClose={() => setIsUnavailModalOpen(false)}
        title={`Block Period for Room ${selectedRoom?.code}`}
      >
        <form onSubmit={handleAddUnavail} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={unavailFormData.date}
              onChange={(e) => setUnavailFormData({ ...unavailFormData, date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={unavailFormData.start_time}
                onChange={(e) => setUnavailFormData({ ...unavailFormData, start_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={unavailFormData.end_time}
                onChange={(e) => setUnavailFormData({ ...unavailFormData, end_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason</label>
            <input
              type="text"
              required
              value={unavailFormData.reason}
              onChange={(e) => setUnavailFormData({ ...unavailFormData, reason: e.target.value })}
              placeholder="e.g. AC Maintenance, Scheduled Renovation"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUnavailModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/30"
            >
              Confirm Block
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
