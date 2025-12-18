import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

interface TimePickerProps {
  value: string; // formato HH:MM
  onChange: (time: string) => void;
  disabled?: boolean;
}

export default function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse do horário atual
  const parseTime = (timeStr: string) => {
    if (timeStr) {
      const [hour, minute] = timeStr.split(':').map(Number);
      return { hour, minute };
    }
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  };

  const { hour: selectedHour, minute: selectedMinute } = parseTime(value);
  const [tempHour, setTempHour] = useState(selectedHour);
  const [tempMinute, setTempMinute] = useState(selectedMinute);

  const handleOpen = () => {
    const { hour, minute } = parseTime(value);
    setTempHour(hour);
    setTempMinute(minute);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    const hourStr = String(tempHour).padStart(2, '0');
    const minuteStr = String(tempMinute).padStart(2, '0');
    onChange(`${hourStr}:${minuteStr}`);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <View>
      {/* Campo de input */}
      <TouchableOpacity
        style={[styles.input, disabled && styles.inputDisabled]}
        onPress={() => !disabled && handleOpen()}
        disabled={disabled}
      >
        <Text style={styles.inputText}>
          {value || 'Selecionar hora'}
        </Text>
        <Text style={styles.clockIcon}>🕐</Text>
      </TouchableOpacity>

      {/* Modal do time picker */}
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
          <View style={styles.pickerContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.title}>Selecionar Horário</Text>

            {/* Display do horário selecionado */}
            <View style={styles.timeDisplay}>
              <Text style={styles.timeDisplayText}>
                {String(tempHour).padStart(2, '0')}:{String(tempMinute).padStart(2, '0')}
              </Text>
            </View>

            {/* Seletores de hora e minuto */}
            <View style={styles.selectorsRow}>
              {/* Horas */}
              <View style={styles.selectorColumn}>
                <Text style={styles.selectorLabel}>Hora</Text>
                <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.listItem,
                        tempHour === hour && styles.listItemSelected,
                      ]}
                      onPress={() => setTempHour(hour)}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          tempHour === hour && styles.listItemTextSelected,
                        ]}
                      >
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Separador */}
              <Text style={styles.separator}>:</Text>

              {/* Minutos */}
              <View style={styles.selectorColumn}>
                <Text style={styles.selectorLabel}>Minuto</Text>
                <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.listItem,
                        tempMinute === minute && styles.listItemSelected,
                      ]}
                      onPress={() => setTempMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          tempMinute === minute && styles.listItemTextSelected,
                        ]}
                      >
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Atalhos rápidos */}
            <View style={styles.quickButtons}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => {
                  const now = new Date();
                  setTempHour(now.getHours());
                  setTempMinute(now.getMinutes());
                }}
              >
                <Text style={styles.quickButtonText}>Agora</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => {
                  setTempHour(6);
                  setTempMinute(0);
                }}
              >
                <Text style={styles.quickButtonText}>06:00</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => {
                  setTempHour(12);
                  setTempMinute(0);
                }}
              >
                <Text style={styles.quickButtonText}>12:00</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => {
                  setTempHour(18);
                  setTempMinute(0);
                }}
              >
                <Text style={styles.quickButtonText}>18:00</Text>
              </TouchableOpacity>
            </View>

            {/* Botões de ação */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
  },
  clockIcon: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: 320,
    maxWidth: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  timeDisplay: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  timeDisplayText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
  },
  selectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  selectorColumn: {
    flex: 1,
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '600',
  },
  scrollList: {
    height: 150,
    width: '100%',
  },
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 8,
  },
  listItemSelected: {
    backgroundColor: '#007AFF',
  },
  listItemText: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
  },
  listItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  separator: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8E8E93',
    marginHorizontal: 8,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
