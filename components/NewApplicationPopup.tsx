import React, { useEffect, useState } from 'react';
import { X, User, Mail, Calendar, GraduationCap } from 'lucide-react';
import { Student } from '@/types';

interface NewApplicationPopupProps {
  application: Student;
  onClose: () => void;
}

export default function NewApplicationPopup({ application, onClose }: NewApplicationPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);
    
    // Play notification sound
    const playSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    };
    
    playSound();
    
    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const getStudentName = (student: Pick<Student, 'first_name' | 'middle_name' | 'last_name'>) =>
    `${student.first_name} ${student.middle_name ? `${student.middle_name} ` : ''}${student.last_name}`.replace(/\s+/g, ' ').trim();

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-80 max-w-[85vw]">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">New Application!</h3>
              <p className="text-xs text-gray-500">Just submitted</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <User size={14} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900">
                {getStudentName(application)}
              </p>
              <p className="text-xs text-gray-500">Applicant Name</p>
            </div>
          </div>

          {application.student_uid && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <GraduationCap size={14} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">{application.student_uid}</p>
                <p className="text-xs text-gray-500">Application ID</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Auto-closes in 8 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
