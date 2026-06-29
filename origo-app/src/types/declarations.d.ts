declare module 'react-native-mmkv' {
  export interface MMKVConfiguration {
    id?: string;
    path?: string;
    encryptionKey?: string;
  }

  export class MMKV {
    constructor(configuration?: MMKVConfiguration);
    set(key: string, value: string | number | boolean): void;
    getString(key: string): string | undefined;
    getNumber(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    delete(key: string): void;
    clearAll(): void;
    contains(key: string): boolean;
    getAllKeys(): string[];
  }
}

declare module 'react-native-deck-swiper' {
  import { ComponentType } from 'react';
  import { ViewStyle } from 'react-native';

  interface SwiperProps<T> {
    cards: T[];
    renderCard: (card: T, index: number) => React.ReactNode;
    onSwipedLeft?: (index: number) => void;
    onSwipedRight?: (index: number) => void;
    onSwipedTop?: (index: number) => void;
    onSwipedBottom?: (index: number) => void;
    onSwipedAll?: () => void;
    onTapCard?: (index: number) => void;
    cardIndex?: number;
    backgroundColor?: string;
    stackSize?: number;
    stackSeparation?: number;
    stackScale?: number;
    cardVerticalMargin?: number;
    cardHorizontalMargin?: number;
    containerStyle?: ViewStyle;
    cardStyle?: ViewStyle;
    showSecondCard?: boolean;
    animateCardOpacity?: boolean;
    overlayLabels?: Record<string, { title?: string; style?: { label?: object; wrapper?: object } }>;
    ref?: React.Ref<{ swipeLeft: () => void; swipeRight: () => void; jumpToCardIndex: (n: number) => void }>;
  }

  export default class Swiper<T> extends React.Component<SwiperProps<T>> {
    swipeLeft(): void;
    swipeRight(): void;
    jumpToCardIndex(index: number): void;
  }
}

declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency?: string;
    name?: string;
    description?: string;
    order_id?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
  }
  const RazorpayCheckout: {
    open: (options: RazorpayOptions) => Promise<{ razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }>;
  };
  export default RazorpayCheckout;
}
