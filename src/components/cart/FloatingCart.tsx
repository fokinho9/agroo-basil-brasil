import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';
import { CartUpsell } from './CartUpsell';

export function FloatingCart() {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, getTotal } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen && items.length > 0) {
      setIsAnimating(true);
    }
  }, [isOpen, items.length]);

  if (!isOpen || items.length === 0) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-foreground/50 z-40 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Cart Panel - animated from bottom left */}
      <div 
        className={`fixed left-4 bottom-4 md:left-auto md:right-0 md:top-0 md:bottom-0 w-[calc(100%-2rem)] md:w-full max-w-md bg-card border border-border md:border-l shadow-xl z-50 rounded-lg md:rounded-none flex flex-col max-h-[80vh] md:max-h-full md:h-full ${
          isAnimating ? 'animate-scale-in md:animate-slide-in-right' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Carrinho</h2>
            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5">
              {items.length}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex gap-3 bg-muted rounded-lg p-3">
              <img
                src={item.product.image_url || '/placeholder.svg'}
                alt={item.product.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate">
                  {item.product.name}
                </h3>
                <p className="text-primary font-semibold text-sm mt-1">
                  {formatCurrency(item.product.price)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upsell Section */}
        <div className="px-4 pb-2">
          <CartUpsell />
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="text-xl font-bold text-foreground">{formatCurrency(getTotal())}</span>
          </div>
          <Link to="/checkout" onClick={() => setIsOpen(false)}>
            <Button className="w-full" size="lg">
              Finalizar Compra
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsOpen(false)}
          >
            Continuar Comprando
          </Button>
        </div>
      </div>
    </>
  );
}
