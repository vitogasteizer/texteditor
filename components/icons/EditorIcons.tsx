import React from 'react';

const iconProps = {
  className: "w-5 h-5 text-gray-700 dark:text-gray-300",
  strokeWidth: "2",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};
const menuIconProps = { ...iconProps, className: "w-4 h-4 mr-2" };

export const BoldIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className ?? iconProps.className}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
);
export const ItalicIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className ?? iconProps.className}><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
);
export const UnderlineIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className ?? iconProps.className}><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
);
export const StrikethroughIcon: React.FC = () => (
  <svg {...iconProps}><path d="M16 4H9a3 3 0 0 0-2.83 4"></path><path d="M14 12a4 4 0 0 1 0 8H6"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg>
);
export const ListOrderedIcon: React.FC = () => (
  <svg {...iconProps}><line x1="10" x2="21" y1="6" y2="6"></line><line x1="10" x2="21" y1="12" y2="12"></line><line x1="10" x2="21" y1="18" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
);
export const ListUnorderedIcon: React.FC = () => (
  <svg {...iconProps}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);
export const ChecklistIcon: React.FC = () => (
    <svg {...iconProps}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
);
export const AlignLeftIcon: React.FC = () => (
  <svg {...iconProps}><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
);
export const AlignCenterIcon: React.FC = () => (
  <svg {...iconProps}><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>
);
export const AlignRightIcon: React.FC = () => (
  <svg {...iconProps}><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
);
export const AlignJustifyIcon: React.FC = () => (
  <svg {...iconProps}><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
);
export const UndoIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
);
export const RedoIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>
);
export const ClearFormattingIcon: React.FC = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M4 7V4h16v3"/>
        <path d="M5 20h14"/>
        <path d="M12 4v16"/>
        <line x1="21" y1="4" x2="3" y2="20"/>
    </svg>
);
export const MenuIcon: React.FC = () => (
  <svg {...iconProps}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
export const CloseIcon: React.FC = () => (
    <svg {...iconProps}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
export const ChevronDownIcon: React.FC = () => (
    <svg {...iconProps} className="w-4 h-4 text-gray-600 dark:text-gray-400"><path d="m6 9 6 6 6-6"></path></svg>
);
export const ChevronRightIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className ?? "w-4 h-4 text-gray-500 dark:text-gray-400"}><path d="m9 18 6-6-6-6"></path></svg>
);
export const ArrowLeftIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
export const TextColorIcon: React.FC = () => (
    <svg {...iconProps}><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
);
export const BgColorIcon: React.FC = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
        <path d="m9 11-6 6v3h9l3-3"/>
        <path d="m22 6-6 6-3-3 6-6Z"/>
        <path d="m18 10 3-3"/>
    </svg>
);
export const LineHeightIcon: React.FC = () => (
    <svg {...iconProps}><path d="M3 12h18M3 6h12M3 18h12M19 3l3 3-3 3M19 21l3-3-3-3"/></svg>
);
export const GridViewIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);
export const ListViewIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><line x1="8" x2="21" y1="6" y2="6"></line><line x1="8" x2="21" y1="12" y2="12"></line><line x1="8" x2="21" y1="18" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);
export const MoreVerticalIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || iconProps.className}><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
);
export const FileTextIcon: React.FC<{className?: string; isMenuIcon?: boolean}> = ({className, isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className || (isMenuIcon ? menuIconProps.className : iconProps.className)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
export const Trash2Icon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
export const EditIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
export const ZoomInIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || iconProps.className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);
export const ZoomOutIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || iconProps.className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);
export const PaintBrushIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
);
export const TextShadowIcon: React.FC = () => (
    <svg {...iconProps} viewBox="0 0 24 24"><path d="M12.25 18.5H5.75M18 18.5H16.25M14 6.5L10 18.5M19 4L5 4"></path></svg>
);
export const RowInsertTopIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><path d="M21 14H3"/><path d="M21 6H3"/><path d="M12 10V2"/><path d="m15 5-3-3-3 3"/><path d="M12 18v2"/></svg>
);
export const RowInsertBottomIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><path d="M21 10H3"/><path d="M21 18H3"/><path d="M12 14v8"/><path d="m15 19-3 3-3-3"/></svg>
);
export const ColumnInsertLeftIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><path d="M14 21V3"/><path d="M6 21V3"/><path d="M10 12H2"/><path d="m5 9 3 3-3 3"/></svg>
);
export const ColumnInsertRightIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><path d="M10 21V3"/><path d="M18 21V3"/><path d="M14 12h8"/><path d="m19 9-3 3 3 3"/></svg>
);
export const MergeCellsIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><rect width="8" height="8" x="2" y="2" rx="2"/><rect width="8" height="8" x="14" y="2" rx="2"/><rect width="8" height="8" x="8" y="14" rx="2"/><path d="M12 14v-4h4"/></svg>
);
export const SplitCellIcon: React.FC<{className?: string}> = ({className}) => (
  <svg {...iconProps} className={className || iconProps.className}><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-4-4H3"/><path d="M21 21V12a4 4 0 0 0-4-4h-5"/></svg>
);
// Menu Bar Icons
export const FilePlusIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
);
export const SaveIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);
export const FolderIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);
export const DownloadIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
export const PrinterIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
);
export const ScissorsIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
);
export const CopyIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
export const ClipboardIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
);
export const SelectAllIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4" strokeDashoffset="1"></rect></svg>
);
export const SearchIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
export const LinkIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
);
export const LinkOffIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || iconProps.className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
);
export const ImageIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);
export const TableIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>
);
export const MinusIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
export const MessageSquareIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
export const CodeIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);
export const BarChartIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>
);
export const EyeIcon: React.FC<{isMenuIcon?: boolean; className?: string;}> = ({isMenuIcon, className}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
export const MaximizeIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
);
export const InfoIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);
export const OmegaIcon: React.FC<{ isMenuIcon?: boolean }> = ({ isMenuIcon }) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M4 18h16M4 18c0-4.4 3.6-8 8-8s8 3.6 8 8M4 18c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>
);
export const PdfIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10.4 12.6c.2.8.9 1.4 1.7 1.4 1.1 0 1.9-.9 1.9-2s-.8-2-1.9-2c-.5 0-1 .2-1.3.5"/><path d="M15 12h1.5a2 2 0 0 1 0 4h-1.5v-2.5"/><path d="M4 12h2a2 2 0 0 1 0 4H4v-4Z"/></svg>
);
export const SquareIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
);
export const CircleIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><circle cx="12" cy="12" r="10"></circle></svg>
);
export const TriangleIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
);
export const TypeIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
);
export const SplitSquareVerticalIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><path d="M5 8V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v3"/><path d="M19 16v3c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-3"/><line x1="4" x2="20" y2="12" y1="12"/></svg>
);
export const RectangleVerticalIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><rect x="5" y="3" width="14" height="18" rx="2"/></svg>
);
export const RectangleHorizontalIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><rect x="3" y="5" width="18" height="14" rx="2"/></svg>
);
export const LanguageIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
    <svg {...(isMenuIcon ? menuIconProps : iconProps)}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
);
export const SparklesIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
    <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)} fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" /></svg>
);
export const MicIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
    <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className || (isMenuIcon ? menuIconProps.className : iconProps.className)}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
);
export const Volume2Icon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);
export const BookTextIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
    <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
);
export const LanguagesIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
    <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
);
export const PenLineIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
    <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/></svg>
);
export const SmileIcon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
    <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
);
export const Wand2Icon: React.FC<{isMenuIcon?: boolean; className?: string}> = ({isMenuIcon, className}) => (
    <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
);
export const BotIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || iconProps.className}><path d="M12 8V4H8"/><rect x="4" y="12" width="16" height="8" rx="2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M12 18v-2"/><path d="M9 16h6"/></svg>
);
export const MapIcon: React.FC<{isMenuIcon?: boolean, className?: string}> = ({isMenuIcon, className}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)} className={className ?? (isMenuIcon ? menuIconProps.className : iconProps.className)}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" x2="8" y1="2" y2="18"/><line x1="16" x2="16" y1="6" y2="22"/></svg>
);
export const BrainCircuitIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || iconProps.className}><path d="M12 2a2.5 2.5 0 0 1 3 3.2l.2.3a2.5 2.5 0 0 1 2.5 2.5v.5a2.5 2.5 0 0 1-2.5 2.5l-.3.2a2.5 2.5 0 0 1-3.2 3m0 0a2.5 2.5 0 0 1-3-3.2l-.2-.3a2.5 2.5 0 0 1-2.5-2.5v-.5a2.5 2.5 0 0 1 2.5-2.5l.3-.2a2.5 2.5 0 0 1 3.2-3m0 0V2m0 16.5V22m-6.5-5.5.4-.4m12.2.4-.4-.4M3.8 9.2l.4.4M20.2 9.2l-.4.4M12 12v3.5"/><path d="M12 7.5V6"/><circle cx="12" cy="12" r="2.5"/><path d="M3.5 14.5A2.5 2.5 0 0 0 6 17v0a2.5 2.5 0 0 0 2.5-2.5"/><path d="M20.5 14.5A2.5 2.5 0 0 1 18 17v0a2.5 2.5 0 0 1-2.5-2.5"/><path d="M3.5 9.5A2.5 2.5 0 0 1 6 7v0a2.5 2.5 0 0 1 2.5 2.5"/><path d="M20.5 9.5A2.5 2.5 0 0 0 18 7v0a2.5 2.5 0 0 0-2.5 2.5"/></svg>
);
export const SendIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || iconProps.className}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
);
export const StopCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || iconProps.className}><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6"/></svg>
);
export const KeyboardIcon: React.FC<{isMenuIcon?: boolean}> = ({isMenuIcon}) => (
  <svg {...(isMenuIcon ? menuIconProps : iconProps)}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h4M18 14h.01"/></svg>
);
