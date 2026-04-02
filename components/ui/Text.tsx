import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
  color?: string;
  weight?: 'normal' | '500' | '600' | 'bold' | '900';
  align?: TextStyle['textAlign'];
}

export const Text = ({ 
  style, 
  variant = 'body', 
  color, 
  weight,
  align = 'left',
  ...props 
}: TextProps) => {
  const { colors } = useTheme();

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1': return { fontSize: 32, fontWeight: 'bold' };
      case 'h2': return { fontSize: 24, fontWeight: 'bold' };
      case 'h3': return { fontSize: 20, fontWeight: '600' };
      case 'h4': return { fontSize: 18, fontWeight: '600' };
      case 'body': return { fontSize: 16 };
      case 'caption': return { fontSize: 14 };
      case 'label': return { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 };
      default: return { fontSize: 16 };
    }
  };

  return (
    <RNText
      style={[
        getVariantStyle(),
        { 
          color: color || colors.text,
          textAlign: align,
        },
        weight && { fontWeight: weight },
        style,
      ]}
      {...props}
    />
  );
};
