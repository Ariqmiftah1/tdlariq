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

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: '<span style="color: #333333; font-weight: bold;">Tambahkan Tugas Baru</span>',
      html: `
        <div style="display: flex; flex-direction: column; gap: 15px; background-color: #f4f4f8; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <input id="swal-input1" class="swal2-input" placeholder="Nama tugas" style="padding: 12px; font-size: 1rem; border: 1px solid #ddd; border-radius: 5px; background: #ffffff; color: #333333;"/>
          <input id="swal-input2" type="datetime-local" class="swal2-input" style="padding: 12px; font-size: 1rem; border: 1px solid #ddd; border-radius: 5px; background: #ffffff; color: #333333;"/>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<span style="font-weight: bold;">Tambah</span>',
      confirmButtonColor: '#4caf50', // Hijau untuk tombol konfirmasi
      cancelButtonText: '<span style="font-weight: bold;">Batal</span>',
      cancelButtonColor: '#9e9e9e', // Abu-abu untuk tombol batal
      customClass: {
        popup: 'swal-custom-popup',
      },
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

  const editTask = async (id: string, currentText: string, currentDeadline: string): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: '<span style="color: #333333; font-weight: bold;">Edit Tugas</span>',
      html: `
        <div style="display: flex; flex-direction: column; gap: 15px; background-color: #f4f4f8; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <input id="swal-input1" class="swal2-input" value="${currentText}" placeholder="Nama tugas" style="padding: 12px; font-size: 1rem; border: 1px solid #ddd; border-radius: 5px; background: #ffffff; color: #333333;"/>
          <input id="swal-input2" type="datetime-local" class="swal2-input" value="${new Date(currentDeadline).toISOString().slice(0, 16)}" style="padding: 12px; font-size: 1rem; border: 1px solid #ddd; border-radius: 5px; background: #ffffff; color: #333333;"/>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<span style="font-weight: bold;">Simpan</span>',
      confirmButtonColor: '#6c63ff', // Biru untuk tombol konfirmasi
      cancelButtonText: '<span style="font-weight: bold;">Batal</span>',
      cancelButtonColor: '#9e9e9e', // Abu-abu untuk tombol batal
      customClass: {
        popup: 'swal-custom-popup',
      },
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
      style={{
        maxWidth: '500px',
        margin: '40px auto',
        padding: '20px',
        borderRadius: '20px',
        backgroundColor: '#f4f4f8', // Latar belakang terang
        color: '#333333', // Teks lebih gelap untuk kontras
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)', // Shadow untuk kesan jatuh
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#6c63ff', // Warna judul lembut
        }}
      >
        To-Do List (⁠⁠╹⁠▽⁠╹⁠⁠)
      </h1>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={addTask}
          style={{
            padding: '12px 24px',
            borderRadius: '5px',
            background: 'linear-gradient(145deg, #d9e4ff, #a3b9ff)', // Warna tombol terang
            color: '#333333', // Warna teks gelap untuk kontras
            fontWeight: 'bold',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          + Tambah Tugas
        </button>
        <span
          style={{
            padding: '5px',
            borderRadius: '3px',
            background: '#e6e6fa', // Latar belakang terang
            color: '#333333', // Teks gelap
            fontWeight: 'bold',
            boxShadow: '0 5px 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          {tasks.length}
        </span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = calculateTimeRemaining(task.deadline);
            const isExpired = timeLeft === 'Waktu habis!';
            const taskColor = task.completed
              ? '#c8e6c9' // Hijau terang untuk tugas selesai
              : isExpired
              ? '#ffcdd2' // Merah terang untuk tugas melebihi deadline
              : '#d1c4e9'; // Ungu terang untuk tugas dalam tenggat waktu

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{
                  backgroundColor: taskColor,
                  borderRadius: '10px',
                  padding: '15px',
                  marginBottom: '15px',
                  color: '#333333', // Teks gelap
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Shadow untuk kesan jatuh
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    onClick={() => toggleTask(task.id)}
                    style={{
                      flex: 1,
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: task.completed ? '#555555' : '#333333',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      cursor: 'pointer',
                      marginRight: '10px',
                    }}
                  >
                    {task.text}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#555555', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Deadline: {new Date(task.deadline).toLocaleString()}</span>
                  <span style={{ color: '#6c63ff', fontWeight: 'bold' }}>
                    ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                  </span>
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    marginTop: '10px',
                  }}
                >
                  <button
                    onClick={() => editTask(task.id, task.text, task.deadline)}
                    style={{
                      padding: '10px',
                      borderRadius: '5px',
                      background: 'linear-gradient(145deg, #f9fbe7, #c5e1a5)', // Hijau terang untuk edit
                      color: '#333333',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '5px',
                      background: 'linear-gradient(145deg, #ffebee, #ef9a9a)', // Merah terang untuk hapus
                      color: '#333333',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}