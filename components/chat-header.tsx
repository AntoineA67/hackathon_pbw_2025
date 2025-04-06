'use client';

import Link from 'next/link';
import { useWindowSize } from 'usehooks-ts';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { type VisibilityType } from './visibility-selector';
import { IoMdReturnLeft } from "react-icons/io";
import { usePathname } from 'next/navigation'

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const path = usePathname();

  return (
    <header className="flex sticky top-0 bg-background p-3 md:px-2 gap-2">
      {(!open || windowWidth < 768) && path != "/" && (
        <Link href='/'>
          <IoMdReturnLeft size={30} className="transition-all ease-in-out duration-300 p-1 rounded-lg active:bg-white active:text-black"/>
        </Link>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
