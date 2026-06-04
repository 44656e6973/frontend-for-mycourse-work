import { type SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function BrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path
        d="M12 3.75c-4.058 0-7.25 2.87-7.25 6.5 0 2.418 1.475 4.54 3.721 5.67v4.08c0 .69.793 1.08 1.34.659l3.44-2.657c.206-.159.46-.244.72-.244h1.03c4.058 0 7.25-2.87 7.25-6.508 0-3.63-3.192-6.5-7.25-6.5Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.75h.008v.008H12V7.75ZM12 11v3.25" />
    </svg>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 17.5h-7c-.483 0-.875-.392-.875-.875 0-.197.066-.387.188-.54l.914-1.142c.542-.678.838-1.52.838-2.387v-1.09a2.874 2.874 0 1 1 5.75 0v1.09c0 .867.296 1.71.838 2.387l.914 1.142c.301.377.24.927-.137 1.228a.874.874 0 0 1-.543.187Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.75 20a1.25 1.25 0 0 0 2.5 0" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="6.25" />
      <path strokeLinecap="round" d="m16 16 3.75 3.75" />
    </svg>
  )
}

export function HeartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19.25 5.955 13.37a3.75 3.75 0 0 1 5.303-5.303L12 8.81l.742-.742a3.75 3.75 0 0 1 5.303 5.303L12 19.25Z"
      />
    </svg>
  )
}

export function CommentIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.25 16.25H5.5A1.75 1.75 0 0 1 3.75 14.5v-7A1.75 1.75 0 0 1 5.5 5.75h13A1.75 1.75 0 0 1 20.25 7.5v7a1.75 1.75 0 0 1-1.75 1.75h-6.17l-3.5 2.75a.5.5 0 0 1-.8-.394v-2.356Z"
      />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 6.75 10.5 10.5M17.25 6.75l-10.5 10.5" />
    </svg>
  )
}

export function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect width="16.5" height="12.5" x="3.75" y="5.75" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 8.25 5.67 4.25a1.8 1.8 0 0 0 2.16 0l5.67-4.25" />
    </svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect width="14.5" height="10.5" x="4.75" y="10" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10V7.75a3.75 3.75 0 0 1 7.5 0V10" />
      <path strokeLinecap="round" d="M12 14.25v2" />
    </svg>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="8.5" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.75 19.25a6.25 6.25 0 0 1 12.5 0" />
    </svg>
  )
}
