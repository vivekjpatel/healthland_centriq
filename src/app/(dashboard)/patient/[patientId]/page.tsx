import { redirect } from "next/navigation";

type PatientAliasPageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function PatientAliasPage({ params }: PatientAliasPageProps) {
  const { patientId } = await params;
  redirect(`/patients/${patientId}`);
}
