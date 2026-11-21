import { LegalLayout, LEGAL, type LegalSection } from './Legal'

const sections: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    content: (
      <>
        <p>
          Splitify is a service for tracking shared expenses and settling up in groups. We decide how and why
          your personal data is used in the app, which makes us the data controller. You can reach us at{' '}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    content: (
      <>
        <h3>Information you give us</h3>
        <ul>
          <li><strong>Account:</strong> username, email address, password (if you sign up with email), and the avatar you choose.</li>
          <li><strong>Google sign-in:</strong> if you use Google, we receive your name, email address, and profile picture from Google.</li>
          <li><strong>Groups and money records:</strong> group names and members, expenses (title, amount, date, who paid, how it was split), and recorded payments.</li>
          <li><strong>Chat:</strong> messages you send in group and private chats.</li>
          <li><strong>AI assistant:</strong> the questions you ask and the spending information needed to answer them.</li>
        </ul>
        <h3>Information created when you use the app</h3>
        <ul>
          <li><strong>Notifications</strong> about expenses, payments, and reminders.</li>
          <li><strong>Online status:</strong> whether you are currently online, shown to people you share a group or chat with.</li>
          <li><strong>Technical data:</strong> IP address, browser and device type, and server logs used to keep the service working and secure.</li>
          <li><strong>Session data:</strong> authentication tokens and cookies that keep you signed in.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use your information',
    content: (
      <>
        <ul>
          <li>To create your account and sign you in.</li>
          <li>To calculate balances, simplify debts, and show who owes what.</li>
          <li>To deliver chat messages, notifications, and reminders in real time.</li>
          <li>To answer your questions through the AI assistant.</li>
          <li>To keep Splitify secure, prevent abuse, find and fix problems, and monitor performance.</li>
          <li>To contact you about your account or changes to our terms.</li>
        </ul>
        <p>We do not sell your personal data, and we do not use it for advertising.</p>
      </>
    ),
  },
  {
    id: 'who-sees',
    title: 'Who can see your information',
    content: (
      <>
        <h3>Other people in the app</h3>
        <p>
          Splitify is built for sharing, so some of your information is visible to others by design. Members of
          a group can see the group’s expenses, payments, and chat, plus your name and avatar. Friends can also
          see your email address and whether you are online.
        </p>
        <h3>Service providers</h3>
        <p>
          We use trusted providers to run Splitify: hosting and infrastructure, Google for sign-in, and an AI
          service provider to power the assistant. They may process data only to provide their service to us.
        </p>
        <h3>Legal reasons</h3>
        <p>
          We may disclose information if the law requires it, or if it is necessary to protect the rights,
          safety, or security of our users or the service.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar technologies',
    content: (
      <>
        <p>
          We use cookies and local storage only for what the app needs: keeping you signed in, remembering your
          light or dark theme, and protecting your session. We do not use advertising or cross-site tracking
          cookies.
        </p>
      </>
    ),
  },
  {
    id: 'legal-basis',
    title: 'Why we may process your data',
    content: (
      <>
        <p>
          We process personal data in line with Moroccan Law No. 09-08 on the protection of individuals with
          regard to the processing of personal data, and its oversight by the CNDP. Our reasons are:
        </p>
        <ul>
          <li>to provide the service you asked for (your account, groups, and balances);</li>
          <li>your consent, where we ask for it, which you can withdraw at any time;</li>
          <li>our legitimate interest in keeping Splitify secure and working properly;</li>
          <li>legal obligations that apply to us.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    content: (
      <>
        <p>
          We keep your information while your account is active. If you ask us to delete your account, we
          remove or anonymize your personal data within a reasonable time. Expenses and payments you shared
          with a group may be kept, with your name replaced, so the other members’ balances stay correct.
          Some data may remain briefly in backups and logs before it is overwritten.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect it',
    content: (
      <>
        <p>
          We use encrypted connections (HTTPS/TLS), authenticated sessions, and access controls to protect your
          data. No system is completely secure, so please use a strong, unique password and tell us right away
          if you suspect misuse of your account.
        </p>
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your choices and rights',
    content: (
      <>
        <p>You can ask us to:</p>
        <ul>
          <li>give you access to the personal data we hold about you;</li>
          <li>correct information that is wrong or out of date;</li>
          <li>delete your account and personal data;</li>
          <li>stop processing your data for a particular purpose, where the law allows.</li>
        </ul>
        <p>
          You can edit your name and avatar in your profile. For anything else, write to{' '}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. Depending on where you live you may
          have additional rights, and you can always contact your local data protection authority, including the
          CNDP in Morocco.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    content: (
      <>
        <p>
          Splitify is not meant for anyone under 18, and we do not knowingly collect data from children. If you
          think a child has created an account, contact us and we will remove it.
        </p>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'Where your data is processed',
    content: (
      <>
        <p>
          Our providers may process data in other countries. When that happens, we take steps to make sure your
          information stays protected in line with this policy and applicable law.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <>
        <p>
          We may update this policy as Splitify changes. When we do, we will update the date at the top and
          notify you in the app for meaningful changes.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <>
        <p>
          Questions or requests about your data? Write to <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
        </p>
      </>
    ),
  },
]

export function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro="This policy explains what Splitify collects, why, and the choices you have. We try to collect only what a shared-expense app needs."
      summary={[
        'We collect what is needed to run your account, groups, expenses, chat, and notifications.',
        'People in your groups can see the shared records and chat, plus your name and avatar.',
        'We never sell your data and we don’t show ads.',
        'You can ask us to access, correct, or delete your data at any time.',
      ]}
      sections={sections}
      other={{ to: '/terms', label: 'Terms of Service' }}
    />
  )
}

export default Privacy
