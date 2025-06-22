import ContactPage from './ContactPage';

export default async function ContactRoute({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  return <ContactPage id={id} />;
}
