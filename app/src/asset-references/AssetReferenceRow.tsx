import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';
import type { AssetReference } from './assetReference.types';
import { getCategoryShort } from './categories';

interface AssetReferenceRowProps {
  reference: AssetReference;
}

export default function AssetReferenceRow({ reference }: AssetReferenceRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{getCategoryShort(reference.category)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{reference.name}</Text>
        {reference.locationHint ? (
          <Text style={styles.hint}>{`▸ ${reference.locationHint}`}</Text>
        ) : (
          <Text style={styles.hintMissing}>▸ Not yet documented</Text>
        )}
        {reference.detail ? <Text style={styles.detail}>{reference.detail}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#dcefe9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconText: {
    color: colors.teal,
    fontWeight: '700',
    fontSize: 11
  },
  content: {
    flex: 1,
    gap: 2
  },
  name: {
    fontWeight: '600',
    fontSize: 14.5,
    color: colors.ink
  },
  hint: {
    fontSize: 12,
    color: colors.muted
  },
  hintMissing: {
    fontSize: 12,
    color: colors.dangerText
  },
  detail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2
  }
});
