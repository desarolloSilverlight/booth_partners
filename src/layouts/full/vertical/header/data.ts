import { Icon } from '@iconify/react';

interface ProfileType {
  href: string;
  title: string;
  icon: JSX.Elements;
}
const profile: ProfileType[] = [
  {
    href: '/form-layouts',
    title: 'Perfil',
    icon: <Icon icon="solar:user-circle-line-duotone" height = { 50} color="#b81f3c" />,
  },
  {
    href: '/tables/basic-table',
    title: 'Notas',
    icon: <Icon icon="solar:notes-line-duotone" height = { 50} color="#b81f3c" />,
  },
];
export { profile };
