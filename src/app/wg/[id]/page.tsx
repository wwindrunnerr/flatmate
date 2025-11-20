import WGDashboard from "./WGDashboard";

export default async function Page({params}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params; // unwrap Promise here

    return <WGDashboard id={id} />;
}