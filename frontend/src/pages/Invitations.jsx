import { useEffect, useState } from "react";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageTitle from "../components/ui/PageTitle";

import { getInvitations } from "../services/tripService";

export default function Invitations() {
    const [friendInvitations, setFriendInvitations] = useState([]);
    const [tripInvitations, setTripInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadInvitations() {
            const data = await getInvitations();

            setFriendInvitations(
                data.filter((invitation) => invitation.type === "friend")
            );

            setTripInvitations(
                data.filter((invitation) => invitation.type === "trip")
            );

            setLoading(false);
        }

        loadInvitations();
    }, []);

    function handleAcceptFriend(id) {
        alert(`Zaakceptowano zaproszenie do znajomych ID: ${id}`);

        setFriendInvitations((prev) =>
            prev.filter((invitation) => invitation.id !== id)
        );
    }

    function handleRejectFriend(id) {
        alert(`Odrzucono zaproszenie do znajomych ID: ${id}`);

        setFriendInvitations((prev) =>
            prev.filter((invitation) => invitation.id !== id)
        );
    }

    function handleAcceptTrip(id) {
        alert(`Zaakceptowano zaproszenie do podróży ID: ${id}`);

        setTripInvitations((prev) =>
            prev.filter((invitation) => invitation.id !== id)
        );
    }

    function handleRejectTrip(id) {
        alert(`Odrzucono zaproszenie do podróży ID: ${id}`);

        setTripInvitations((prev) =>
            prev.filter((invitation) => invitation.id !== id)
        );
    }

    return (
        <Layout>
            <main className="content">
                <PageTitle
                    title="Zaproszenia"
                    subtitle="Zarządzaj zaproszeniami do znajomych i wspólnych podróży"
                />

                {loading && <p>Ładowanie zaproszeń...</p>}

                {!loading && (
                    <>
                        <section className="invitations-section">
                            <h2>Zaproszenia do znajomych</h2>

                            {friendInvitations.length === 0 ? (
                                <Card>
                                    <p>Nie masz żadnych zaproszeń do znajomych.</p>
                                </Card>
                            ) : (
                                friendInvitations.map((invitation) => (
                                    <Card
                                        className="invite-card"
                                        key={invitation.id}
                                    >
                                        <div>
                                            <strong>{invitation.user}</strong>
                                            <p>Chce dodać Cię do znajomych.</p>
                                        </div>

                                        <div className="invite-buttons">
                                            <Button
                                                onClick={() =>
                                                    handleAcceptFriend(invitation.id)
                                                }
                                            >
                                                Akceptuj
                                            </Button>

                                            <Button
                                                variant="blue"
                                                onClick={() =>
                                                    handleRejectFriend(invitation.id)
                                                }
                                            >
                                                Odrzuć
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </section>

                        <section className="invitations-section">
                            <h2>Zaproszenia do podróży</h2>

                            {tripInvitations.length === 0 ? (
                                <Card>
                                    <p>Nie masz żadnych zaproszeń do podróży.</p>
                                </Card>
                            ) : (
                                tripInvitations.map((invitation) => (
                                    <Card
                                        className="invite-card"
                                        key={invitation.id}
                                    >
                                        <div>
                                            <strong>{invitation.user}</strong>
                                            <p>
                                                Zaprasza Cię do podróży:{" "}
                                                <strong>{invitation.trip}</strong>
                                            </p>
                                        </div>

                                        <div className="invite-buttons">
                                            <Button
                                                onClick={() =>
                                                    handleAcceptTrip(invitation.id)
                                                }
                                            >
                                                Akceptuj
                                            </Button>

                                            <Button
                                                variant="blue"
                                                onClick={() =>
                                                    handleRejectTrip(invitation.id)
                                                }
                                            >
                                                Odrzuć
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </section>
                    </>
                )}
            </main>
        </Layout>
    );
}