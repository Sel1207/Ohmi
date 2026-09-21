import placeholder from '../assets/avatar-placeholder.svg';

interface Props {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: Props) {
  return <img className={`avatar avatar-${size}`} src={src || placeholder} alt={`${name} profile`} />;
}
