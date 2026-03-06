import {
  type ButtonHTMLAttributes,
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ContactBookingForm from "@/components/ContactBookingForm";

type ContactModalContextValue = {
  openModal: () => void;
  closeModal: () => void;
};

const ContactModalContext = createContext<ContactModalContextValue | null>(null);

export const ContactModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formRenderKey, setFormRenderKey] = useState(0);

  const contextValue = useMemo<ContactModalContextValue>(
    () => ({
      openModal: () => {
        setFormRenderKey((previous) => previous + 1);
        setIsOpen(true);
      },
      closeModal: () => setIsOpen(false),
    }),
    [],
  );

  return (
    <ContactModalContext.Provider value={contextValue}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl overflow-hidden border-0 bg-transparent p-0 shadow-none sm:w-[calc(100vw-4rem)]">
          <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-0 sm:max-h-[calc(100vh-4rem)]">
            <ContactBookingForm key={formRenderKey} />
          </div>
        </DialogContent>
      </Dialog>
    </ContactModalContext.Provider>
  );
};

type ContactModalButtonProps = {
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const ContactModalButton = ({
  className,
  children,
  onClick,
  type = "button",
  ...props
}: ContactModalButtonProps) => {
  const modal = useContext(ContactModalContext);

  if (!modal) {
    throw new Error("ContactModalButton must be used within ContactModalProvider");
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (!event.defaultPrevented) {
      modal.openModal();
    }
  };

  return (
    <button type={type} onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  );
};

export const useContactModal = () => {
  const modal = useContext(ContactModalContext);

  if (!modal) {
    throw new Error("useContactModal must be used within ContactModalProvider");
  }

  return modal;
};
