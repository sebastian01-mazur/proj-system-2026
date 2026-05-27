import { Link, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";

export default function Expenses() {
    const { id } = useParams();

    return (
        <Layout>
            <main className="content">
                <Link to={`/trip/${id}`} className="back-btn">
                    ← Wróć
                </Link>

                <PageTitle
                    title="Wydatki"
                />

                <Card>
                    <p>Tutaj będzie:</p>

                    <ul>
                        <li>lista wydatków</li>
                        <li>dodawanie wydatku</li>
                        <li>edycja wydatku</li>
                        <li>podział kosztów</li>
                        <li>kategorie wydatków</li>
                    </ul>
                </Card>
            </main>
        </Layout>
    );
}