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
        background: 'linear-gradient(180deg, #1a1a2e, #16213e)', // Warna gelap
        color: '#ffffff',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.9)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#00B4D8',
        }}
      >
        TO DO LIST
      </h1>
      <div style={{ textAlign: 'center', marginBottom: '20px', color: '#00B4D8' }}>
        Jumlah Tugas: {tasks.length}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={addTask}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            background: 'linear-gradient(90deg, #394867, #212A3E)',
            color: '#ffffff',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          TAMBAH TUGAS
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = calculateTimeRemaining(task.deadline);
            const isExpired = timeLeft === 'Waktu habis!';
            const taskColor = isExpired
              ? '#d9534f' // Merah lembut
              : task.completed
              ? '#2e3a46'
              : '#4b5d67';

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
                  padding: '20px',
                  marginBottom: '15px',
                  color: '#ffffff',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
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
                      color: task.completed ? '#aaaaaa' : '#ffffff',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      cursor: 'pointer',
                      marginRight: '10px',
                    }}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => editTask(task.id, task.text, task.deadline)}
                    style={{
                      padding: '10px',
                      borderRadius: '5px',
                      background: 'linear-gradient(145deg, #6c7983, #3a3f47)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '5px',
                      background: 'linear-gradient(145deg, #d9534f, #b52a2a)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    HAPUS
                  </button>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#aaaaaa' }}>
                  Deadline: {new Date(task.deadline).toLocaleString()}
                </p>
                <p
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: isExpired ? '#d9534f' : '#8e97f2',
                  }}
                >
                  ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                </p>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}