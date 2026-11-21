import { LegalLayout, LEGAL, type LegalSection } from './Legal'

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Accepting these terms',
    content: (
      <>
        <p>
          By creating an account or using Splitify, you agree to these Terms. If you don’t agree, please
          don’t use the service. If you use Splitify on behalf of a group, you confirm that you may share
          that group’s information with Splitify.
        </p>
      </>
    ),
  },
  {
    id: 'what-it-is',
    title: 'What Splitify is, and isn’t',
    content: (
      <>
        <p>
          Splitify is a tool for recording shared expenses, working out who owes whom, and keeping a group’s
          accounts clear. It is a <strong>record-keeping tool only</strong>.
        </p>
        <ul>
          <li>Splitify does not hold, send, or receive money. Payments happen between you and the people you pay, by cash, bank transfer, or any method you choose.</li>
          <li>Marking a balance as paid records that you and the other person agree it was paid. It does not move money.</li>
          <li>Splitify is not a bank, payment provider, or financial, tax, or legal adviser.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Your account',
    content: (
      <>
        <p>
          You must be at least 18 years old to use Splitify. You can sign up with an email address or with
          Google. You agree to:
        </p>
        <ul>
          <li>give accurate information and keep it up to date;</li>
          <li>keep your login details private and tell us promptly if you think someone else has used your account;</li>
          <li>take responsibility for activity that happens under your account.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'groups',
    title: 'Groups, expenses, and what others can see',
    content: (
      <>
        <p>
          Groups are shared spaces. When you add an expense, payment, or chat message to a group, every member
          of that group can see it, along with your name and avatar. Friends can also see your email address.
        </p>
        <p>
          You are responsible for what you enter. Please make sure expenses, amounts, and splits are accurate
          and that you only add people you know. Don’t add personal information about someone else unless
          they would reasonably expect it to be shared with the group.
        </p>
      </>
    ),
  },
  {
    id: 'balances',
    title: 'Balances and settling up',
    content: (
      <>
        <p>
          Balances, “simplified debts”, and suggested payments are calculated from what group members enter.
          If entries are wrong or missing, the numbers will be too. Splitify does its best to calculate
          correctly, but you should check the amounts before you pay anyone.
        </p>
        <p>
          Any disagreement about who owes what is between you and the other people involved. Splitify is not
          a party to those arrangements and can’t resolve disputes or collect money for you.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>break the law or use Splitify to record or hide unlawful activity;</li>
          <li>harass, threaten, or abuse other people in chat, group names, or reminders;</li>
          <li>send spam or use reminders to pressure someone repeatedly;</li>
          <li>impersonate another person or create accounts to mislead others;</li>
          <li>try to access other people’s data, probe or disrupt our systems, or scrape the service, unless we have agreed in writing;</li>
          <li>upload malicious code or content you have no right to share.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai',
    title: 'The AI assistant',
    content: (
      <>
        <p>
          Splitify includes an AI assistant that can answer questions about your group’s spending and suggest
          ways to settle up. Its answers are generated automatically and can be wrong or incomplete. Always
          check important figures against the expense list before acting on them. The assistant does not give
          financial or legal advice.
        </p>
      </>
    ),
  },
  {
    id: 'notifications',
    title: 'Notifications and reminders',
    content: (
      <>
        <p>
          Splitify sends in-app notifications when expenses and payments are added. When you press “Remind”,
          we send a reminder to the other person on your behalf. Use reminders reasonably.
        </p>
      </>
    ),
  },
  {
    id: 'content',
    title: 'Your content',
    content: (
      <>
        <p>
          You keep ownership of what you add to Splitify. You give us permission to store, display, and process
          it only as needed to run the service for you and your groups, for example showing an expense to the
          other members of the group. This permission ends when the content is deleted, except where we need
          to keep records to keep other members’ balances accurate.
        </p>
      </>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and changes to the service',
    content: (
      <>
        <p>
          Splitify is free to use today. We work to keep it available, but we can’t promise it will always be
          uninterrupted or error-free. We may change, add, or remove features. If we ever introduce paid
          features, we will tell you before they apply to you.
        </p>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Ending your account',
    content: (
      <>
        <p>
          You can stop using Splitify at any time and ask us to delete your account by writing to{' '}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. We may suspend or close accounts
          that break these Terms or put others at risk, and we will explain why where we reasonably can.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Disclaimers and liability',
    content: (
      <>
        <p>
          Splitify is provided “as is” and “as available”. To the fullest extent the law allows, we are not
          liable for losses that come from: incorrect entries made by users, payments made or not made between
          users, unavailability of the service, or decisions you make based on balances or AI answers. Nothing
          in these Terms limits any right you have by law that cannot be limited.
        </p>
      </>
    ),
  },
  {
    id: 'law',
    title: 'Governing law',
    content: (
      <>
        <p>
          These Terms are governed by the laws of the Kingdom of Morocco. Disputes will be brought before the
          competent Moroccan courts, unless the law of your country of residence gives you the right to go
          elsewhere.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    content: (
      <>
        <p>
          We may update these Terms from time to time. When we make a meaningful change, we will update the
          date at the top of this page and notify you in the app. Continuing to use Splitify after a change
          means you accept the updated Terms.
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
          Questions about these Terms? Write to <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
        </p>
      </>
    ),
  },
]

export function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      intro="These terms explain how Splitify works and what we expect from each other. We’ve kept them as plain as we can."
      sections={sections}
      other={{ to: '/privacy', label: 'Privacy Policy' }}
    />
  )
}

export default Terms
