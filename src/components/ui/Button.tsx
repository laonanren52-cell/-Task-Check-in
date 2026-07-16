import type { ButtonHTMLAttributes, ReactNode } from 'react'
export function Button({children,variant='primary',className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{children:ReactNode;variant?:'primary'|'secondary'|'danger'|'ghost'}){return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>}
