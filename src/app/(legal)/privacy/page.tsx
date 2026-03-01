export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: March 1, 2026</p>

      <p>
        SmartLots Pro (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the SmartLots Pro
        mobile application and admin portal (collectively, the
        &quot;Service&quot;). This Privacy Policy explains how we collect, use,
        disclose, and safeguard your information when you use our Service.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>Account Information</h3>
      <p>
        When your employer creates an account for you, we collect your email
        address and a hashed password. Account creation is performed by
        authorized dealership administrators.
      </p>

      <h3>Vehicle Data</h3>
      <p>
        When you create a ticket in the app, you may provide vehicle
        information including VIN, make, model, year, license plate number, and
        photographs of the vehicle. This data is collected on behalf of the
        dealership that employs you.
      </p>

      <h3>Location &amp; Parking Data</h3>
      <p>
        We record which dealership location a vehicle is parked at, movement
        history between locations, and parking status. This is operational data
        used to manage dealership inventory.
      </p>

      <h3>Device Information</h3>
      <p>
        We may collect device type, operating system version, and unique device
        identifiers for the purpose of delivering the Service and
        troubleshooting technical issues.
      </p>

      <h3>Camera &amp; Photos</h3>
      <p>
        The app requests access to your device&apos;s camera to photograph
        vehicles during the ticketing process. Photos are uploaded to secure
        cloud storage and associated with the relevant vehicle ticket. We do not
        access your personal photo library — only photos taken within the app
        are collected.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain the Service</li>
        <li>To authenticate your identity and manage your account</li>
        <li>To store and display vehicle ticket data and photos</li>
        <li>To track vehicle locations within dealership premises</li>
        <li>To send transactional emails (password resets, account setup)</li>
        <li>To improve and optimize the Service</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h2>3. Data Sharing &amp; Disclosure</h2>
      <p>
        We do not sell, rent, or trade your personal information. We may share
        data in the following circumstances:
      </p>
      <ul>
        <li>
          <strong>With your employer:</strong> Dealership administrators can
          view all ticket data, vehicle photos, and account information for
          users within their organization.
        </li>
        <li>
          <strong>Service providers:</strong> We use third-party services
          (Supabase for database and authentication, Vercel for hosting, Mailgun
          for email, Mapbox for mapping) that process data on our behalf under
          strict confidentiality agreements.
        </li>
        <li>
          <strong>Legal requirements:</strong> We may disclose information if
          required by law, regulation, or legal process.
        </li>
      </ul>

      <h2>4. Data Storage &amp; Security</h2>
      <p>
        Your data is stored in secure cloud infrastructure provided by Supabase
        (PostgreSQL database with Row Level Security) and Supabase Storage
        (encrypted at rest). We implement industry-standard security measures
        including:
      </p>
      <ul>
        <li>Encrypted data transmission (TLS/HTTPS)</li>
        <li>Row Level Security policies restricting data access by role</li>
        <li>Hashed passwords (never stored in plain text)</li>
        <li>Role-based access control (Super Admin, Admin, User)</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>
        We retain your account data for as long as your employer maintains an
        active subscription. Vehicle ticket data and photos are retained
        according to your employer&apos;s retention policies. When an account is
        deleted, we soft-delete the record and may retain anonymized data for
        analytics purposes.
      </p>

      <h2>6. Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Object to or restrict processing of your data</li>
        <li>Data portability</li>
      </ul>
      <p>
        To exercise these rights, contact your dealership administrator or
        email us at{" "}
        <a href="mailto:support@smartlotpro.com">support@smartlotpro.com</a>.
      </p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>
        Our Service is not directed to individuals under 18 years of age. We do
        not knowingly collect personal information from children.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you
        of changes by posting the new policy on this page and updating the
        &quot;Last updated&quot; date.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us at:
      </p>
      <ul>
        <li>
          Email:{" "}
          <a href="mailto:support@smartlotpro.com">support@smartlotpro.com</a>
        </li>
        <li>Website: https://smartlotpro.com</li>
      </ul>
    </article>
  );
}
