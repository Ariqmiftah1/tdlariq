'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const editTask = async (id: string, currentText: string, currentDeadline: string): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${currentText}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${new Date(currentDeadline).toISOString().slice(0, 16)}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && (formValues[0] !== currentText || formValues[1] !== currentDeadline)) {
      const updatedTasks = tasks.map((task) =>
        task.id === id ? { ...task, text: formValues[0], deadline: formValues[1] } : task
      );
      setTasks(updatedTasks);

      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, { text: formValues[0], deadline: formValues[1] });
    }
  };

  return (
  <div
    className="max-w-md mx-auto mt-10 p-4 rounded-lg"
    style={{
      backgroundColor: '#F5F5DC', // Warna krem untuk latar belakang
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}
  >
    <h1
      className="text-2xl font-bold mb-4 flex justify-center"
      style={{
        color: '#2E8B57', // Hijau gelap untuk teks judul
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      TO DO LIST
    </h1>
    <div className="flex justify-center mb-4">
      <button
        onClick={addTask}
        className="px-4 py-2 rounded"
        style={{
          backgroundColor: '#4682B4', // Biru untuk tombol
          color: '#FFFFFF',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        Tambah Tugas
      </button>
    </div>
    <ul>
      <AnimatePresence>
        {tasks.map((task) => {
          const timeLeft = calculateTimeRemaining(task.deadline);
          const isExpired = timeLeft === 'Waktu habis!';
          const taskColor = task.completed
            ? '#98FB98' // Hijau muda untuk tugas selesai
            : isExpired
            ? '#FF6347' // Merah untuk tugas yang sudah habis waktu
            : '#FFFACD'; // Kuning muda untuk tugas aktif

          return (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: taskColor,
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid #D3D3D3',
              }}
            >
              <div className="flex justify-between items-center space-x-2">
                <span
                  onClick={() => toggleTask(task.id)}
                  className={`flex-1 cursor-pointer transition-500 ${
                    task.completed
                      ? 'line-through text-gray-500'
                      : 'font-semibold text-gray-700'
                  }`}
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '16px',
                  }}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => editTask(task.id, task.text, task.deadline)}
                  className="p-2 rounded"
                  style={{
                    backgroundColor: '#4682B4', // Biru untuk tombol
                    color: '#FFFFFF',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 rounded"
                  style={{
                    backgroundColor: '#8B4513', // Coklat untuk tombol
                    color: '#FFFFFF',
                  }}
                >
                  Hapus
                </button>
              </div>
              <p className="text-sm" style={{ color: '#2E8B57' }}>
                Deadline: {new Date(task.deadline).toLocaleString()}
              </p>
              <p className="text-xs font-semibold" style={{ color: '#2E8B57' }}>
                ⏳ {timeRemaining[task.id] || 'Menghitung...'}
              </p>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  </div>
);