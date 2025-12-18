import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';

interface DatePickerProps {
  value: string; // formato YYYY-MM-DD
  onChange: (date: string) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const theme = useColors();
  const [isOpen, setIsOpen] = useState(false);

  // Parse da data atual ou usar hoje
  const parseDate = (dateStr: string) => {
    if (dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  };

  const selectedDate = parseDate(value);
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  // Formatar data para exibição DD/MM/YYYY
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Gerar dias do mês
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
    const days: (number | null)[] = [];

    // Dias vazios antes do primeiro dia
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDayPress = (day: number) => {
    const month = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${viewYear}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isSelectedDay = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const days = generateCalendarDays();

  return (
    <View>
      {/* Campo de input */}
      <TouchableOpacity
        style={[styles.input, { backgroundColor: theme.background.secondary }, disabled && styles.inputDisabled]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[styles.inputText, { color: theme.text.primary }]}>
          {formatDisplayDate(value) || 'Selecionar data'}
        </Text>
        <Feather name="calendar" size={18} color={theme.text.tertiary} />
      </TouchableOpacity>

      {/* Modal do calendário */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.calendarContainer, { backgroundColor: theme.background.secondary }]} onStartShouldSetResponder={() => true}>
            {/* Header do calendário */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
                <Feather name="chevron-left" size={20} color={theme.accent.primary} />
              </TouchableOpacity>
              <Text style={[styles.monthYearText, { color: theme.text.primary }]}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                <Feather name="chevron-right" size={20} color={theme.accent.primary} />
              </TouchableOpacity>
            </View>

            {/* Dias da semana */}
            <View style={styles.weekDaysRow}>
              {DAYS_OF_WEEK.map((day) => (
                <Text key={day} style={[styles.weekDayText, { color: theme.text.tertiary }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Dias do mês */}
            <View style={styles.daysGrid}>
              {days.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    day && isSelectedDay(day) && [styles.dayCellSelected, { backgroundColor: theme.accent.primary }],
                    day && isToday(day) && !isSelectedDay(day) && [styles.dayCellToday, { borderColor: theme.accent.primary }],
                  ]}
                  onPress={() => day && handleDayPress(day)}
                  disabled={!day}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: theme.text.primary },
                      day && isSelectedDay(day) && styles.dayTextSelected,
                      day && isToday(day) && !isSelectedDay(day) && [styles.dayTextToday, { color: theme.accent.primary }],
                    ]}
                  >
                    {day || ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botão Hoje */}
            <TouchableOpacity
              style={[styles.todayButton, { backgroundColor: theme.background.tertiary }]}
              onPress={() => {
                const today = new Date();
                setViewMonth(today.getMonth());
                setViewYear(today.getFullYear());
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                onChange(`${today.getFullYear()}-${month}-${day}`);
                setIsOpen(false);
              }}
            >
              <Text style={[styles.todayButtonText, { color: theme.accent.primary }]}>Hoje</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    borderRadius: 16,
    padding: 16,
    width: 320,
    maxWidth: '90%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayCellSelected: {},
  dayCellToday: {
    borderWidth: 1,
  },
  dayText: {
    fontSize: 16,
  },
  dayTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  dayTextToday: {
    fontWeight: '600',
  },
  todayButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
