import { useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

const faqs = [
  {
    question: 'How do I add a new venue?',
    answer:
      'Navigate to Management → Venues and click the "Add Venue" button. Fill in all required fields including name, city, category, pricing, and registration fee. The venue will be published immediately when created by an admin.',
  },
  {
    question: 'How does the pre-booking system work?',
    answer:
      'When a user books a venue, they pay only the registration fee upfront via Razorpay. The booking goes to "Pre-Booked" status. An agent then contacts the user for the remaining balance. Once full payment is received, use the "Confirm Payment" action in Bookings to mark it as confirmed with a transaction ID.',
  },
  {
    question: 'How do I manage venue owners?',
    answer:
      'Go to Management → Owners to create, edit, or deactivate owner accounts. Owners can log in to their portal to manage their venues, view bookings, and submit support tickets. When an owner submits or edits a venue, it goes through an approval workflow.',
  },
  {
    question: 'How does the venue approval workflow work?',
    answer:
      'When an owner submits a new venue, it appears with "Pending Review" status. You can approve or reject it from the Venues page. If an owner edits an already-approved venue, the changes go to "Pending Changes" status for your review before being applied.',
  },
  {
    question: 'How do subscriptions work?',
    answer:
      'Users can subscribe to a monthly plan (₹49/month) via Razorpay. Subscribers get special benefits at venues (discounts, priority booking, etc.). You can manage subscriptions from the Subscribers page — activate or cancel them manually if needed.',
  },
  {
    question: 'How do I send notifications to users?',
    answer:
      'Go to Management → Notifications. You can send individual notifications to specific users or broadcast announcements to all users. Push notifications are sent automatically for booking confirmations and status changes.',
  },
  {
    question: 'How do I handle support tickets?',
    answer:
      'Venue owners can submit support tickets from their portal. View and respond to tickets from Management → Support Tickets. You can change the status (open, in progress, resolved, closed) and add admin replies.',
  },
  {
    question: 'How are reviews moderated?',
    answer:
      'Users can only review venues where they have a confirmed or pre-booked booking (one review per venue). You can view and delete inappropriate reviews from Management → Reviews. Deleting a review automatically recalculates the venue rating.',
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='border-b last:border-b-0'>
      <button
        type='button'
        className='flex w-full items-center justify-between py-4 text-left text-sm font-medium hover:underline'
        onClick={() => setOpen(!open)}
      >
        {question}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className='pb-4 text-sm text-muted-foreground'>
          {answer}
        </div>
      )}
    </div>
  )
}

export function HelpCenterPage() {
  return (
    <>
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold tracking-tight'>Help Center</h1>
          <p className='text-muted-foreground'>
            Find answers to common questions and get support
          </p>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* FAQ Section */}
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <HelpCircle className='h-5 w-5' />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Common questions about managing the ZVenue platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='w-full'>
                  {faqs.map((faq, index) => (
                    <FaqItem key={index} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Resources */}
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageSquare className='h-5 w-5' />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Email</p>
                    <p className='text-sm text-muted-foreground'>support@zvenue.in</p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <Phone className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Phone</p>
                    <p className='text-sm text-muted-foreground'>+91 97876 54321</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BookOpen className='h-5 w-5' />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button variant='outline' className='w-full justify-start gap-2' asChild>
                  <a href='/venues'>
                    <ExternalLink className='h-4 w-4' />
                    Manage Venues
                  </a>
                </Button>
                <Button variant='outline' className='w-full justify-start gap-2' asChild>
                  <a href='/bookings'>
                    <ExternalLink className='h-4 w-4' />
                    View Bookings
                  </a>
                </Button>
                <Button variant='outline' className='w-full justify-start gap-2' asChild>
                  <a href='/owners'>
                    <ExternalLink className='h-4 w-4' />
                    Manage Owners
                  </a>
                </Button>
                <Button variant='outline' className='w-full justify-start gap-2' asChild>
                  <a href='/support'>
                    <ExternalLink className='h-4 w-4' />
                    Support Tickets
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
