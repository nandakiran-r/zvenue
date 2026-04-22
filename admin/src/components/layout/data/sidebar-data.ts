import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Users,
  Tags,
  Bell,
  Settings,
  UserCog,
  Palette,
  Monitor,
  HelpCircle,
  BarChart3,
  Command,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'ZVenue Admin',
    email: 'admin@zvenue.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'ZVenue',
      logo: Command,
      plan: 'Admin Panel',
    },
  ],
  navGroups: [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Analytics',
          url: '/analytics',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          title: 'Venues',
          url: '/venues',
          icon: Building2,
        },
        {
          title: 'Bookings',
          url: '/bookings',
          icon: CalendarCheck,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Categories',
          url: '/categories',
          icon: Tags,
        },
        {
          title: 'Notifications',
          url: '/notifications',
          icon: Bell,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
