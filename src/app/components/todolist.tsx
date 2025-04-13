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
      title: 'Tambahkan tugas baru',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Nama tugas">
        <input id="swal-input2" type="datetime-local" class="swal2-input">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const text = (document.getElementById('swal-input1') as HTMLInputElement)?.value.trim();
        const deadline = (document.getElementById('swal-input2') as HTMLInputElement)?.value.trim();
        if (!text || !deadline) {
          Swal.showValidationMessage('Harap isi semua bidang!');
        }
        return [text, deadline];
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
      html: `
        <input id="swal-input1" class="swal2-input" value="${currentText}" placeholder="Nama tugas">
        <input id="swal-input2" type="datetime-local" class="swal2-input" value="${new Date(currentDeadline).toISOString().slice(0, 16)}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const text = (document.getElementById('swal-input1') as HTMLInputElement)?.value.trim();
        const deadline = (document.getElementById('swal-input2') as HTMLInputElement)?.value.trim();
        if (!text || !deadline) {
          Swal.showValidationMessage('Harap isi semua bidang!');
        }
        return [text, deadline];
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
        borderRadius: '10px',
        background: 'linear-gradient(180deg, #f8f8f8, #ffffff)', // Warna cerah
        color: '#000000',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={addTask}
          style={{
            padding: '10px 20px',
            borderRadius: '5px',
            background: '#007BFF',
            color: '#ffffff',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          TAMBAH TUGAS
        </button>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#555' }}>Jumlah Tugas: {tasks.length}</span>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = calculateTimeRemaining(task.deadline);
            const isExpired = timeLeft === 'Waktu habis!';
            const taskColor = isExpired
              ? '#f8d7da' // Merah lembut untuk waktu habis
              : task.completed
              ? '#d4edda' // Hijau lembut untuk selesai
              : '#fff3cd'; // Kuning lembut untuk dalam hitungan waktu

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
                  color: '#333',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div>
                  <span
                    onClick={() => toggleTask(task.id)}
                    style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: task.completed ? '#6c757d' : '#333',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {task.text}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#555', margin: '5px 0' }}>
                  Deadline: {new Date(task.deadline).toLocaleString()} {isExpired && '(Waktu habis!)'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => editTask(task.id, task.text, task.deadline)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '5px',
                      background: '#17a2b8',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '5px',
                      background: '#dc3545',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
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