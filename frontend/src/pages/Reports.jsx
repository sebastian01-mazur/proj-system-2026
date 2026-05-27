import { Link, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";

export default function Reports() {
    const { id } = useParams();

    return (
        <Layout>
            <main className="content">
                <Link to={`/trip/${id}`} className="back-btn">
                    ← Wróć
                </Link>

                <PageTitle
                    title="Raporty i statystyki"
                />

                <Card>
                    <p>Tutaj będzie:</p>

                    <ul>
                        <li>wykres wydatków</li>
                        <li>budżet vs wydatki</li>
                        <li>saldo uczestników</li>
                        <li>bilans rozliczeń</li>
                        <li>statystyki podróży</li>
                    </ul>
                </Card>
            </main>
        </Layout>
    );
}