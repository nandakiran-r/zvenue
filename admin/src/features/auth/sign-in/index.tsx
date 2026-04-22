import { SignIn as ClerkSignIn } from '@clerk/react'

export function SignIn() {
  return (
    <div className='flex min-h-svh items-center justify-center bg-muted/30 p-4'>
      <div className='w-full max-w-md'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold tracking-tight' style={{ color: '#7a3317' }}>
            ZVenue
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Admin Dashboard
          </p>
        </div>
        <ClerkSignIn
          appearance={{
            elements: {
              formButtonPrimary: {
                backgroundColor: '#7a3317',
                '&:hover': { backgroundColor: '#5c2511' },
              },
              card: {
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                borderRadius: '16px',
              },
            },
          }}
          fallbackRedirectUrl='/'
        />
      </div>
    </div>
  )
}
