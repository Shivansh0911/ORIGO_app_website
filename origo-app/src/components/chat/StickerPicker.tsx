import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Pressable,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';

const STICKER_PACKS = [
  {
    id: 'vibes',
    name: '🔥 Vibes',
    stickers: ['🔥','✨','💯','😎','🥶','😍','🤩','🫠','😭','💀','🤌','👀','🤭','😤','🙌'],
  },
  {
    id: 'campus',
    name: '🎓 Campus',
    stickers: ['📚','📝','☕','🖥️','🏫','📖','🧪','🎒','✏️','🏆','🎯','📊','🔬','💡','🤓'],
  },
  {
    id: 'rizz',
    name: '⚡ Rizz',
    stickers: ['⚡','💕','💫','🫶','💜','🌹','💌','😈','🦋','🌸','💝','🫦','💋','🥰','😘'],
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: string) => void;
}

export default function StickerPicker({ visible, onClose, onSelect }: Props) {
  const [activePack, setActivePack] = useState(0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Tab row */}
        <View style={styles.tabs}>
          {STICKER_PACKS.map((pack, i) => (
            <TouchableOpacity
              key={pack.id}
              style={[styles.tab, activePack === i && styles.tabActive]}
              onPress={() => setActivePack(i)}
            >
              <Text style={styles.tabText}>{pack.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        <FlatList
          data={STICKER_PACKS[activePack].stickers}
          keyExtractor={(_, i) => String(i)}
          numColumns={5}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.stickerCell}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={styles.sticker}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    height: '42%',
    borderTopWidth: 1, borderColor: colors.border,
  },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  grid: { padding: spacing.md },
  stickerCell: {
    flex: 1, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    padding: 6,
  },
  sticker: { fontSize: 32 },
});
