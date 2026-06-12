import { apiRequest } from "./apiConfig";
import { getCurrentUser } from "./authService";

const TRIP_METADATA_KEY = "splittrip_trip_metadata";

function getOrganizerId(explicitOrganizerId) {
  const organizerId = explicitOrganizerId || getCurrentUser()?.id;

  if (!organizerId) {
    throw new Error("Brak ID zalogowanego użytkownika. Zaloguj się ponownie.");
  }

  return organizerId;
}

function normalizeStatus(status = "PLANNED") {
  const statuses = {
    PLANNED: "Planowane",
    IN_PROGRESS: "W trakcie",
    COMPLETED: "Zakończone",
    ACTIVE: "W trakcie",
    FINISHED: "Zakończone",
    Planowana: "Planowane",
    Planowane: "Planowane",
    "W trakcie": "W trakcie",
    Zakończone: "Zakończone",
  };

  return statuses[status] || status || "Planowane";
}

function firstValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && String(value).trim() !== ""
  );
}

function looksLikeEmail(value) {
  return typeof value === "string" && value.includes("@");
}

function shortUserLabel(userId) {
  return userId ? `Użytkownik ${String(userId).slice(0, 8)}` : "Użytkownik";
}

function isGeneratedUserLabel(name) {
  return String(name || "").trim().toLowerCase().startsWith("użytkownik ");
}

function isGenericOrganizerName(name) {
  const normalizedName = String(name || "").trim().toLowerCase();

  return ["organizator", "organizer", "owner", "właściciel", "wlasciciel"].includes(normalizedName);
}

function cleanPersonName(name) {
  if (!name) {
    return "";
  }

  if (isGenericParticipantName(name) || isGenericOrganizerName(name)) {
    return "";
  }

  return String(name).trim();
}

function normalizePersonFromSource(source, fallback = {}) {
  if (typeof source === "string" || typeof source === "number") {
    const value = String(source);

    return compactObject({
      id: looksLikeEmail(value) ? fallback.id : value,
      userId: looksLikeEmail(value) ? fallback.userId : value,
      name: looksLikeEmail(value) ? value : fallback.name,
      email: looksLikeEmail(value) ? value : fallback.email,
      avatar: fallback.avatar,
    });
  }

  if (!isObject(source)) {
    return compactObject(fallback);
  }

  const fullName = joinName(source.firstName, source.lastName || source.surname);
  const id = firstValue(source.userId, source.id, source.uuid, source.accountId, source.profileId, fallback.id, fallback.userId);
  const email = firstValue(source.email, fallback.email, "");

  return compactObject({
    id,
    userId: id,
    name: firstValue(
      cleanPersonName(source.name),
      cleanPersonName(source.fullName),
      cleanPersonName(source.login),
      cleanPersonName(source.userName),
      cleanPersonName(source.username),
      cleanPersonName(source.displayName),
      cleanPersonName(fullName),
      email,
      fallback.name
    ),
    email,
    avatar: firstValue(
      source.avatar,
      source.avatarUrl,
      source.photoUrl,
      source.profilePicture,
      source.profileImageUrl,
      source.imageUrl,
      fallback.avatar,
      ""
    ),
  });
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null)
  );
}

function readTripMetadata() {
  try {
    return JSON.parse(localStorage.getItem(TRIP_METADATA_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveTripMetadata(trip) {
  const tripId = firstValue(trip.id, trip.tripId, trip.idPodrozy);

  if (!tripId) {
    return;
  }

  const metadata = readTripMetadata();
  const previousMetadata = metadata[String(tripId)] || {};

  metadata[String(tripId)] = compactObject({
    ...previousMetadata,
    id: tripId,
    name: firstValue(trip.name, trip.tripName, trip.title, previousMetadata.name),
    tripName: firstValue(trip.tripName, trip.name, trip.title, previousMetadata.tripName),
    country: firstValue(trip.country, trip.destinationCountry, trip.kraj, previousMetadata.country),
    city: firstValue(trip.city, trip.destinationCity, trip.miasto, previousMetadata.city),
    startDate: firstValue(trip.startDate, trip.dateFrom, trip.dataRozpoczecia, previousMetadata.startDate),
    endDate: firstValue(trip.endDate, trip.dateTo, trip.dataZakonczenia, previousMetadata.endDate),
    budget: firstValue(trip.budget, trip.plannedBudget, trip.budzetPlanowany, previousMetadata.budget),
    plannedBudget: firstValue(trip.plannedBudget, trip.budget, trip.budzetPlanowany, previousMetadata.plannedBudget),
    currency: firstValue(trip.currency, trip.baseCurrency, trip.walutaBazowa, previousMetadata.currency),
    baseCurrency: firstValue(trip.baseCurrency, trip.currency, trip.walutaBazowa, previousMetadata.baseCurrency),
    organizerId: firstValue(trip.organizerId, previousMetadata.organizerId),
    organizer: trip.organizer || previousMetadata.organizer,
  });

  localStorage.setItem(TRIP_METADATA_KEY, JSON.stringify(metadata));
}

function getCachedTripMetadata(trip) {
  const tripId = firstValue(trip?.id, trip?.tripId, trip?.idPodrozy);

  if (!tripId) {
    return null;
  }

  return readTripMetadata()[String(tripId)] || null;
}

function isObject(value) {
  return value !== null && typeof value === "object";
}

function joinName(...parts) {
  return parts
    .map((part) => firstValue(part, ""))
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getMemberSource(member) {
  if (!isObject(member)) {
    return member;
  }

  return (
    member.user ||
    member.account ||
    member.profile ||
    member.person ||
    member.participant ||
    member.invitee ||
    member.inviteeUser ||
    member.invitedUser ||
    member.member ||
    null
  );
}

function getSourceId(source) {
  if (typeof source === "string" || typeof source === "number") {
    return String(source);
  }

  if (!isObject(source)) {
    return null;
  }

  return firstValue(
    source.userId,
    source.id,
    source.uuid,
    source.accountId,
    source.profileId,
    source.email
  );
}

function getMembershipId(member) {
  if (!isObject(member)) {
    return null;
  }

  return firstValue(
    member.membershipId,
    member.tripMemberId,
    member.memberId,
    member.invitationId,
    looksLikeMembershipRecord(member) ? member.id : null
  );
}

function isGenericParticipantName(name) {
  const normalizedName = String(name || "").trim().toLowerCase();

  return ["uczestnik", "participant", "member"].includes(normalizedName);
}

function looksLikeMembershipRecord(member) {
  if (!isObject(member)) {
    return false;
  }

  return Boolean(
    member.tripId ||
      member.trip ||
      member.joinedAt ||
      member.invitedAt ||
      member.memberRole ||
      member.membershipId ||
      member.tripMemberId ||
      member.invitationId
  );
}

function getMemberId(member) {
  if (typeof member === "string" || typeof member === "number") {
    return String(member);
  }

  const source = getMemberSource(member);

  const directUserId = firstValue(
    member?.userId,
    member?.id?.userId,
    member?.participantId,
    member?.personId,
    member?.accountId,
    member?.profileId,
    member?.inviteeId,
    member?.invitedUserId,
    member?.memberUserId,
    member?.userUuid,
    member?.uuid
  );

  const nestedUserId = getSourceId(source);
  const shouldUseTopLevelId = !looksLikeMembershipRecord(member) || hasMemberProfileData(member);

  return firstValue(directUserId, nestedUserId, shouldUseTopLevelId ? member?.id : null);
}

function getMemberName(member, fallbackName = "") {
  if (typeof member === "string") {
    return looksLikeEmail(member) ? member : member;
  }

  if (!isObject(member)) {
    return fallbackName;
  }

  const source = getMemberSource(member);
  const directFullName = joinName(member?.firstName, member?.lastName || member?.surname);
  const sourceFullName = isObject(source)
    ? joinName(source?.firstName, source?.lastName || source?.surname)
    : "";
  const sourceAsEmail = typeof source === "string" && looksLikeEmail(source) ? source : "";

  return firstValue(
    cleanPersonName(member?.name),
    cleanPersonName(member?.fullName),
    cleanPersonName(member?.login),
    cleanPersonName(member?.userLogin),
    cleanPersonName(member?.participantLogin),
    cleanPersonName(member?.userName),
    cleanPersonName(member?.username),
    cleanPersonName(member?.displayName),
    cleanPersonName(directFullName),
    member?.email,
    isObject(source) ? cleanPersonName(source?.name) : null,
    isObject(source) ? cleanPersonName(source?.fullName) : null,
    isObject(source) ? cleanPersonName(source?.login) : null,
    isObject(source) ? cleanPersonName(source?.userLogin) : null,
    isObject(source) ? cleanPersonName(source?.participantLogin) : null,
    isObject(source) ? cleanPersonName(source?.userName) : null,
    isObject(source) ? cleanPersonName(source?.username) : null,
    isObject(source) ? cleanPersonName(source?.displayName) : null,
    cleanPersonName(sourceFullName),
    isObject(source) ? source?.email : null,
    sourceAsEmail,
    fallbackName
  );
}

function getMemberEmail(member) {
  if (typeof member === "string") {
    return looksLikeEmail(member) ? member : "";
  }

  const source = getMemberSource(member);

  return firstValue(
    member?.email,
    isObject(source) ? source?.email : null,
    typeof source === "string" && looksLikeEmail(source) ? source : null,
    ""
  );
}

function getMemberAvatar(member) {
  if (typeof member === "string") {
    return "";
  }

  const source = getMemberSource(member);
  return firstValue(
    member?.avatar,
    member?.avatarUrl,
    member?.photoUrl,
    member?.profilePicture,
    member?.profileImageUrl,
    member?.imageUrl,
    isObject(source) ? source?.avatar : null,
    isObject(source) ? source?.avatarUrl : null,
    isObject(source) ? source?.photoUrl : null,
    isObject(source) ? source?.profilePicture : null,
    isObject(source) ? source?.profileImageUrl : null,
    isObject(source) ? source?.imageUrl : null,
    ""
  );
}

function normalizeRole(role, fallbackRole = "Uczestnik") {
  const roleValue = firstValue(role, fallbackRole);
  const normalizedRole = String(roleValue || "").trim().toUpperCase();

  if (["ORGANIZER", "OWNER", "CREATOR", "ADMIN", "ORGANIZATOR"].includes(normalizedRole)) {
    return "Organizator";
  }

  if (["PARTICIPANT", "MEMBER", "USER", "INVITEE", "UCZESTNIK"].includes(normalizedRole)) {
    return "Uczestnik";
  }

  return roleValue || fallbackRole;
}

function hasMemberProfileData(member) {
  if (!isObject(member)) {
    return typeof member === "string" && member.trim() !== "" && !isGenericParticipantName(member);
  }

  const source = getMemberSource(member);
  const directName = firstValue(
    member?.name,
    member?.fullName,
    member?.login,
    member?.userName,
    member?.username,
    member?.displayName,
    member?.firstName
  );
  const sourceName = isObject(source)
    ? firstValue(
        source.name,
        source.fullName,
        source.login,
        source.userLogin,
        source.participantLogin,
        source.userName,
        source.username,
        source.displayName,
        source.firstName
      )
    : "";

  return Boolean(
    (directName && !isGenericParticipantName(directName)) ||
      member?.email ||
      member?.avatar ||
      member?.avatarUrl ||
      member?.photoUrl ||
      member?.profilePicture ||
      (isObject(source) &&
        ((sourceName && !isGenericParticipantName(sourceName)) ||
          source.email ||
          source.avatar ||
          source.avatarUrl ||
          source.photoUrl ||
          source.profilePicture))
  );
}

function normalizeMember(member, fallbackRole = "Uczestnik") {
  const role = normalizeRole(firstValue(member?.role, member?.memberRole), fallbackRole);
  const userId = getMemberId(member);
  const membershipId = getMembershipId(member);
  const email = getMemberEmail(member);
  const name = getMemberName(member, email || "");
  const avatar = getMemberAvatar(member);
  const hasProfileData = Boolean(
    email ||
      avatar ||
      (name && !isGenericParticipantName(name)) ||
      hasMemberProfileData(member)
  );

  return {
    id: userId || membershipId,
    userId,
    memberId: membershipId,
    membershipId,
    name,
    email,
    avatar,
    role,
    isOrganizer: role === "Organizator",
    hasProfileData,
    raw: member,
  };
}

function isRenderableParticipant(participant, organizer = null) {
  if (!participant) {
    return false;
  }

  if (organizer && sameParticipant(participant, organizer)) {
    return true;
  }

  const name = firstValue(participant.name, "");
  const hasIdentity = Boolean(participant.userId || participant.email || participant.avatar);

  if (!hasIdentity && !name) {
    return false;
  }

  if (isGenericParticipantName(name) && !participant.email && !participant.avatar && !participant.hasProfileData) {
    return false;
  }

  return true;
}

function sameParticipant(firstParticipant, secondParticipant) {
  const firstId = firstParticipant?.userId || firstParticipant?.id;
  const secondId = secondParticipant?.userId || secondParticipant?.id;

  if (firstId && secondId && String(firstId) === String(secondId)) {
    return true;
  }

  if (
    firstParticipant?.email &&
    secondParticipant?.email &&
    String(firstParticipant.email).toLowerCase() === String(secondParticipant.email).toLowerCase()
  ) {
    return true;
  }

  return false;
}

function getTripParticipantRole(participant) {
  return firstValue(
    participant?.role,
    participant?.memberRole,
    participant?.tripRole,
    participant?.raw?.role,
    participant?.raw?.memberRole,
    participant?.raw?.tripRole,
    ""
  );
}

function findOrganizerCandidate(participants = []) {
  return participants.find((participant) => {
    const normalizedRole = normalizeRole(getTripParticipantRole(participant), "");

    return (
      participant?.isOrganizer === true ||
      normalizedRole === "Organizator" ||
      getTripParticipantRole(participant) === "ORGANIZER" ||
      getTripParticipantRole(participant) === "OWNER"
    );
  });
}

function normalizeOrganizer(trip, currentUser = getCurrentUser(), organizerCandidate = null, options = {}) {
  const candidateSource = firstValue(
    organizerCandidate?.raw,
    organizerCandidate?.user,
    organizerCandidate?.account,
    organizerCandidate?.profile,
    organizerCandidate,
    null
  );
  const organizerSource = firstValue(trip?.organizer, trip?.createdBy, trip?.owner, candidateSource, {});
  const organizerSourceObject = isObject(organizerSource) ? organizerSource : {};
  const candidateSourceObject = isObject(candidateSource) ? candidateSource : {};
  const sourceId = getSourceId(organizerSource);
  const candidateId = firstValue(
    organizerCandidate?.userId,
    organizerCandidate?.id,
    getMemberId(organizerCandidate),
    getSourceId(candidateSource)
  );
  const sourceEmail = firstValue(
    trip?.organizerEmail,
    trip?.createdByEmail,
    trip?.ownerEmail,
    organizerCandidate?.email,
    organizerSourceObject?.email,
    candidateSourceObject?.email,
    looksLikeEmail(organizerSource) ? organizerSource : null,
    ""
  );
  const organizerId = firstValue(
    trip?.organizerId,
    trip?.createdById,
    trip?.ownerId,
    sourceId,
    candidateId,
    sourceEmail,
    options.fallbackToCurrentUser ? currentUser?.id : null
  );
  const isCurrentUserOrganizer =
    organizerId && currentUser?.id && String(organizerId) === String(currentUser.id);
  const organizerFullName = joinName(
    organizerSourceObject?.firstName,
    organizerSourceObject?.lastName || organizerSourceObject?.surname
  );
  const candidateFullName = joinName(
    candidateSourceObject?.firstName,
    candidateSourceObject?.lastName || candidateSourceObject?.surname
  );
  const currentUserName = firstValue(cleanPersonName(currentUser?.name), currentUser?.email, "");
  const organizerName = firstValue(
    cleanPersonName(trip?.organizerName),
    cleanPersonName(trip?.organizerLogin),
    cleanPersonName(trip?.organizerUsername),
    cleanPersonName(trip?.createdByName),
    cleanPersonName(trip?.createdByLogin),
    cleanPersonName(trip?.createdByUsername),
    cleanPersonName(trip?.ownerName),
    cleanPersonName(trip?.ownerLogin),
    cleanPersonName(trip?.ownerUsername),
    cleanPersonName(organizerCandidate?.name),
    organizerCandidate?.email,
    cleanPersonName(organizerSourceObject?.name),
    cleanPersonName(organizerSourceObject?.fullName),
    cleanPersonName(organizerSourceObject?.login),
    cleanPersonName(organizerSourceObject?.userName),
    cleanPersonName(organizerSourceObject?.username),
    cleanPersonName(organizerSourceObject?.displayName),
    cleanPersonName(organizerFullName),
    cleanPersonName(candidateSourceObject?.name),
    cleanPersonName(candidateSourceObject?.fullName),
    cleanPersonName(candidateSourceObject?.login),
    cleanPersonName(candidateSourceObject?.userName),
    cleanPersonName(candidateSourceObject?.username),
    cleanPersonName(candidateSourceObject?.displayName),
    cleanPersonName(candidateFullName),
    isCurrentUserOrganizer ? currentUserName : null,
    sourceEmail,
    organizerId ? shortUserLabel(organizerId) : "Nieznany organizator"
  );

  return {
    id: organizerId || "organizer",
    userId: organizerId || "organizer",
    name: organizerName,
    email: firstValue(
      sourceEmail,
      organizerCandidate?.email,
      isCurrentUserOrganizer ? currentUser?.email : null,
      ""
    ),
    avatar: firstValue(
      organizerCandidate?.avatar,
      organizerSourceObject?.avatar,
      organizerSourceObject?.avatarUrl,
      organizerSourceObject?.photoUrl,
      organizerSourceObject?.profilePicture,
      organizerSourceObject?.profileImageUrl,
      organizerSourceObject?.imageUrl,
      candidateSourceObject?.avatar,
      candidateSourceObject?.avatarUrl,
      candidateSourceObject?.photoUrl,
      candidateSourceObject?.profilePicture,
      candidateSourceObject?.profileImageUrl,
      candidateSourceObject?.imageUrl,
      isCurrentUserOrganizer ? currentUser?.avatar : null,
      ""
    ),
    role: "Organizator",
    isOrganizer: true,
  };
}

function getParticipantDisplayName(participant) {
  return firstValue(
    participant?.name,
    participant?.email,
    participant?.userId ? `Użytkownik ${String(participant.userId).slice(0, 8)}` : null,
    ""
  );
}

function mergeParticipants(organizer, participants = []) {
  const normalizedOrganizer = {
    ...organizer,
    role: "Organizator",
    isOrganizer: true,
  };

  const result = [normalizedOrganizer];

  participants.map((participant) => normalizeMember(participant)).forEach((participant) => {
    if (sameParticipant(participant, normalizedOrganizer)) {
      const organizerName = isGenericOrganizerName(normalizedOrganizer.name)
        ? ""
        : normalizedOrganizer.name;

      result[0] = {
        ...participant,
        ...normalizedOrganizer,
        name: firstValue(organizerName, participant.name, participant.email, shortUserLabel(normalizedOrganizer.userId)),
        email: normalizedOrganizer.email || participant.email || "",
        avatar: normalizedOrganizer.avatar || participant.avatar || "",
        memberId: participant.memberId || participant.membershipId || normalizedOrganizer.memberId,
        membershipId: participant.membershipId || participant.memberId || normalizedOrganizer.membershipId,
      };
      return;
    }

    if (!isRenderableParticipant(participant, normalizedOrganizer)) {
      return;
    }

    const alreadyAdded = result.some((existingParticipant) =>
      sameParticipant(existingParticipant, participant)
    );

    if (!alreadyAdded) {
      result.push({
        ...participant,
        name: isGenericParticipantName(participant.name)
          ? getParticipantDisplayName({ ...participant, name: "" })
          : getParticipantDisplayName(participant),
        role: participant.isOrganizer ? "Organizator" : "Uczestnik",
      });
    }
  });

  return result;
}

function getTripName(trip) {
  const country = firstValue(trip.country, trip.destinationCountry, trip.kraj, "");
  const city = firstValue(trip.city, trip.destinationCity, trip.miasto, "");
  const name = firstValue(trip.name, trip.tripName, trip.title, trip.nazwa, "");

  if (name && name !== country) {
    return name;
  }

  if (city && city !== country) {
    return city;
  }

  return name || country || "Podróż";
}

function createParticipantFromCurrentUser(currentUser = getCurrentUser()) {
  if (!currentUser?.id) {
    return null;
  }

  return {
    id: currentUser.id,
    userId: currentUser.id,
    name: firstValue(cleanPersonName(currentUser.name), currentUser.email, shortUserLabel(currentUser.id)),
    email: currentUser.email || "",
    avatar: currentUser.avatar || "",
    role: "Uczestnik",
    isOrganizer: false,
    hasProfileData: true,
  };
}

function shouldAddCurrentUserParticipant(source, organizer, tripParticipants, currentUser) {
  if (!currentUser?.id || sameParticipant(currentUser, organizer)) {
    return false;
  }

  const alreadyPresent = tripParticipants
    .map((participant) => normalizeMember(participant))
    .some((participant) => sameParticipant(participant, currentUser));

  if (alreadyPresent) {
    return false;
  }

  // Nie dopisujemy użytkownika tylko dlatego, że w localStorage mamy informację o zaakceptowanym
  // zaproszeniu albo backend zwrócił sam licznik. To tworzyło niespójność: zaproszony widział 2 osoby,
  // a organizator dalej 1. Użytkownika dopinamy awaryjnie tylko wtedy, gdy backend wprost mówi, że
  // aktualne konto jest członkiem tej konkretnej podróży.
  return Boolean(
    source?.currentUserIsMember === true ||
      source?.isMember === true ||
      source?.isParticipant === true ||
      (source?.memberRole && String(source?.userId || source?.participantId || source?.memberUserId || "") === String(currentUser.id)) ||
      (source?.membershipId && String(source?.userId || source?.participantId || source?.memberUserId || "") === String(currentUser.id)) ||
      (source?.tripMemberId && String(source?.userId || source?.participantId || source?.memberUserId || "") === String(currentUser.id))
  );
}

function normalizeTrip(trip, members = [], options = {}) {
  if (!trip) {
    return null;
  }

  const cachedMetadata = getCachedTripMetadata(trip) || {};
  const source = {
    ...cachedMetadata,
    ...trip,
    id: firstValue(trip.id, trip.tripId, trip.idPodrozy, cachedMetadata.id),
    tripId: firstValue(trip.tripId, trip.id, trip.idPodrozy, cachedMetadata.id),
    name: firstValue(trip.name, trip.tripName, trip.title, trip.nazwa, cachedMetadata.name, cachedMetadata.tripName),
    tripName: firstValue(trip.tripName, trip.name, trip.title, trip.nazwa, cachedMetadata.tripName, cachedMetadata.name),
    city: firstValue(trip.city, trip.destinationCity, trip.miasto, cachedMetadata.city),
    country: firstValue(trip.country, trip.destinationCountry, trip.kraj, cachedMetadata.country),
    startDate: firstValue(trip.startDate, trip.dateFrom, trip.dataRozpoczecia, cachedMetadata.startDate),
    endDate: firstValue(trip.endDate, trip.dateTo, trip.dataZakonczenia, cachedMetadata.endDate),
    budget: firstValue(trip.budget, trip.plannedBudget, trip.budzetPlanowany, cachedMetadata.budget),
    plannedBudget: firstValue(trip.plannedBudget, trip.budget, trip.budzetPlanowany, cachedMetadata.plannedBudget),
    currency: firstValue(trip.currency, trip.baseCurrency, trip.walutaBazowa, cachedMetadata.currency),
    baseCurrency: firstValue(trip.baseCurrency, trip.currency, trip.walutaBazowa, cachedMetadata.baseCurrency),
    organizer: firstValue(trip.organizer, trip.createdBy, trip.owner, null),
    organizerId: firstValue(
      trip.organizerId,
      trip.createdById,
      trip.ownerId
    ),
    acceptedParticipant: trip.acceptedParticipant,
    acceptedByUserId: trip.acceptedByUserId,
    fromInvitation: trip.fromInvitation,
  };

  const currentUser = getCurrentUser();
  const apiMembers = Array.isArray(members) ? members : [];
  const embeddedMembers = source.participants || source.members || source.tripMembers || [];
  const tripParticipants = [
    ...(Array.isArray(embeddedMembers) ? embeddedMembers : []),
    ...apiMembers,
  ];

  const organizerCandidate = findOrganizerCandidate(tripParticipants);
  const organizer = normalizeOrganizer(source, currentUser, organizerCandidate, {
    fallbackToCurrentUser: options.fallbackOrganizerToCurrentUser === true,
  });
  const currentUserParticipant = createParticipantFromCurrentUser(currentUser);

  const includeCurrentUserParticipant = options.includeCurrentUserParticipant === true;

  if (
    currentUserParticipant &&
    !sameParticipant(currentUserParticipant, organizer) &&
    (includeCurrentUserParticipant ||
      shouldAddCurrentUserParticipant(source, organizer, tripParticipants, currentUser))
  ) {
    tripParticipants.push(currentUserParticipant);
  }

  const participants = mergeParticipants(organizer, tripParticipants);
  const country = firstValue(source.country, source.destinationCountry, source.kraj, "Brak kraju");
  const city = firstValue(source.city, source.destinationCity, source.miasto, "");
  const budget = Number(firstValue(source.budget, source.plannedBudget, source.budzetPlanowany, 0));
  const currency = firstValue(source.currency, source.baseCurrency, source.walutaBazowa, "EUR");

  return {
    ...source,
    id: source.id,
    tripId: source.tripId,
    name: getTripName(source),
    tripName: getTripName(source),
    country,
    city,
    status: normalizeStatus(source.status),
    startDate: firstValue(source.startDate, source.dateFrom, source.dataRozpoczecia, ""),
    endDate: firstValue(source.endDate, source.dateTo, source.dataZakonczenia, ""),
    budget,
    plannedBudget: Number(firstValue(source.plannedBudget, source.budget, source.budzetPlanowany, 0)),
    currency,
    baseCurrency: firstValue(source.baseCurrency, source.currency, source.walutaBazowa, "EUR"),
    organizer,
    organizerId: organizer.userId || organizer.id,
    organizerName: organizer.name,
    participants,
    members: participants,
    participantsCount: participants.length,
    image:
      source.image ||
      source.imageUrl ||
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
  };
}

function normalizeExpense(expense) {
  const originalAmount = Number(expense.originalAmount ?? expense.amount ?? 0);
  const convertedAmount = Number(
    expense.convertedAmount ?? expense.amountInBaseCurrency ?? expense.amount ?? 0
  );

  return {
    ...expense,
    id: expense.id || expense.expenseId,
    tripId: expense.tripId,
    name: expense.name || expense.title || expense.category || "Wydatek",
    category: expense.category || "Inne",
    date: expense.date || expense.expenseDate || "",
    expenseDate: expense.expenseDate || expense.date || "",
    paidBy: expense.paidBy || expense.payerName || "Użytkownik",
    amount: originalAmount,
    originalAmount,
    currency: expense.currency || expense.originalCurrency || "EUR",
    originalCurrency: expense.originalCurrency || expense.currency || "EUR",
    convertedAmount,
    baseCurrency: expense.baseCurrency || expense.currency || "EUR",
    split: expense.split || [],
  };
}

function getTripIdFromInvitationContext(invitation = {}, acceptedResponse = null) {
  const tripSource = firstValue(
    acceptedResponse?.trip,
    acceptedResponse?.podroz,
    invitation?.tripData,
    invitation?.raw?.trip,
    invitation?.raw?.podroz,
    {}
  );

  return firstValue(
    acceptedResponse?.tripId,
    acceptedResponse?.idPodrozy,
    acceptedResponse?.trip?.id,
    acceptedResponse?.trip?.tripId,
    acceptedResponse?.podroz?.id,
    acceptedResponse?.podroz?.tripId,
    tripSource?.tripId,
    tripSource?.id,
    invitation?.tripId,
    invitation?.idPodrozy,
    invitation?.raw?.tripId,
    invitation?.raw?.idPodrozy
  );
}

async function isUserTripMember(tripId, userId) {
  if (!tripId || !userId) {
    return false;
  }

  try {
    const members = await getTripMembers(tripId);
    return members.some((member) => sameParticipant(member, { id: userId, userId }));
  } catch {
    return false;
  }
}

export async function ensureTripMember(tripId, userId) {
  if (!tripId) {
    throw new Error("Brak ID podróży do dopisania uczestnika.");
  }

  if (!userId) {
    throw new Error("Brak ID użytkownika do dopisania do podróży.");
  }

  if (await isUserTripMember(tripId, userId)) {
    return true;
  }

  const encodedTripId = encodeURIComponent(tripId);
  const encodedUserId = encodeURIComponent(userId);
  const attempts = [
    {
      path: `/trips/${encodedTripId}/members`,
      options: {
        method: "POST",
        body: JSON.stringify({ userId, participantId: userId, role: "PARTICIPANT" }),
      },
    },
    {
      path: `/trips/${encodedTripId}/members/${encodedUserId}`,
      options: { method: "POST" },
    },
    {
      path: `/trips/${encodedTripId}/participants`,
      options: {
        method: "POST",
        body: JSON.stringify({ userId, participantId: userId, role: "PARTICIPANT" }),
      },
    },
    {
      path: `/trips/${encodedTripId}/participants/${encodedUserId}`,
      options: { method: "POST" },
    },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      await apiRequest(attempt.path, attempt.options);

      if (await isUserTripMember(tripId, userId)) {
        return true;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Zaproszenie zostało zaakceptowane, ale backend nie dopisał użytkownika do listy uczestników podróży. ` +
      `Sprawdź endpoint dodawania członka podróży. Ostatni błąd: ${lastError?.message || "brak odpowiedzi"}`
  );
}


export function isInvitationAlreadyExistsError(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("already exists") ||
    message.includes("invitation exists") ||
    message.includes("invitation already") ||
    message.includes("zaproszenie już istnieje") ||
    message.includes("zaproszenie juz istnieje") ||
    message.includes("już istnieje") ||
    message.includes("juz istnieje") ||
    message.includes("duplicate") ||
    message.includes("409")
  );
}

async function runBestEffortInvitationRequests(attempts) {
  let lastError = null;

  for (const attempt of attempts) {
    try {
      return await apiRequest(attempt.path, attempt.options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Brak obsługi zaproszenia po stronie backendu.");
}

function buildInvitationPayload({ tripId, inviteeId, inviterId, status = "PENDING" }) {
  return compactObject({
    tripId,
    userId: inviteeId,
    inviteeId,
    participantId: inviteeId,
    invitedUserId: inviteeId,
    inviterId,
    status,
  });
}

export async function clearTripInvitationForUser(tripId, inviteeId, inviterId = getCurrentUser()?.id) {
  if (!tripId || !inviteeId) {
    return null;
  }

  const encodedTripId = encodeURIComponent(tripId);
  const encodedInviteeId = encodeURIComponent(inviteeId);
  const query = `inviteeId=${encodedInviteeId}${inviterId ? `&inviterId=${encodeURIComponent(inviterId)}` : ""}`;
  const payload = buildInvitationPayload({
    tripId,
    inviteeId,
    inviterId,
    status: "CANCELLED",
  });

  const attempts = [
    {
      path: `/trips/${encodedTripId}/invitations/${encodedInviteeId}`,
      options: { method: "DELETE" },
    },
    {
      path: `/trips/${encodedTripId}/invitations?${query}`,
      options: { method: "DELETE" },
    },
    {
      path: `/trips/invitations?tripId=${encodedTripId}&${query}`,
      options: { method: "DELETE" },
    },
    {
      path: `/trips/${encodedTripId}/invitations/${encodedInviteeId}`,
      options: {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    },
    {
      path: `/trips/${encodedTripId}/invitations`,
      options: {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    },
    {
      path: `/trips/invitations`,
      options: {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    },
  ];

  return runBestEffortInvitationRequests(attempts);
}

export async function reopenTripInvitationForUser(tripId, inviteeId, inviterId = getCurrentUser()?.id) {
  if (!tripId || !inviteeId) {
    throw new Error("Brak ID podróży lub zapraszanego użytkownika.");
  }

  const encodedTripId = encodeURIComponent(tripId);
  const encodedInviteeId = encodeURIComponent(inviteeId);
  const payload = buildInvitationPayload({ tripId, inviteeId, inviterId, status: "PENDING" });

  const attempts = [
    {
      path: `/trips/${encodedTripId}/invitations/${encodedInviteeId}/resend`,
      options: {
        method: "POST",
        body: JSON.stringify(payload),
      },
    },
    {
      path: `/trips/${encodedTripId}/invitations/${encodedInviteeId}/reopen`,
      options: {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    },
    {
      path: `/trips/${encodedTripId}/invitations/${encodedInviteeId}`,
      options: {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    },
    {
      path: `/trips/${encodedTripId}/invitations`,
      options: {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    },
    {
      path: `/trips/invitations/reopen`,
      options: {
        method: "POST",
        body: JSON.stringify(payload),
      },
    },
  ];

  return runBestEffortInvitationRequests(attempts);
}

export async function cacheAcceptedTripMembership(invitation = {}, acceptedResponse = null) {
  const currentUser = getCurrentUser();
  const tripSource = firstValue(
    acceptedResponse?.trip,
    acceptedResponse?.podroz,
    invitation?.tripData,
    invitation?.raw?.trip,
    invitation?.raw?.podroz,
    {}
  );
  const tripId = getTripIdFromInvitationContext(invitation, acceptedResponse);

  if (!tripId || !currentUser?.id) {
    return;
  }

  const organizerSource = firstValue(
    acceptedResponse?.organizer,
    acceptedResponse?.inviter,
    tripSource?.organizer,
    tripSource?.createdBy,
    tripSource?.owner,
    invitation?.organizer,
    invitation?.inviter,
    invitation?.createdBy,
    invitation?.raw?.organizer,
    invitation?.raw?.inviter,
    invitation?.raw?.createdBy,
    {}
  );
  const organizerFallbackName = firstValue(
    invitation?.organizerName,
    invitation?.inviterName,
    invitation?.user,
    invitation?.raw?.organizerName,
    invitation?.raw?.inviterName,
    invitation?.raw?.createdByName,
    ""
  );
  const organizerFallbackEmail = firstValue(
    invitation?.organizerEmail,
    invitation?.inviterEmail,
    invitation?.raw?.organizerEmail,
    invitation?.raw?.inviterEmail,
    invitation?.raw?.createdByEmail,
    ""
  );
  const organizerId = firstValue(
    acceptedResponse?.organizerId,
    acceptedResponse?.inviterId,
    tripSource?.organizerId,
    tripSource?.createdById,
    tripSource?.ownerId,
    invitation?.organizerId,
    invitation?.inviterId,
    invitation?.raw?.organizerId,
    invitation?.raw?.inviterId,
    getSourceId(organizerSource),
    organizerFallbackEmail
  );
  const organizer = normalizePersonFromSource(organizerSource, {
    id: organizerId,
    userId: organizerId,
    name: firstValue(cleanPersonName(organizerFallbackName), organizerFallbackEmail, organizerId ? shortUserLabel(organizerId) : ""),
    email: firstValue(organizerFallbackEmail, ""),
    avatar: firstValue(invitation?.avatar, invitation?.raw?.avatar, ""),
  });

  // Zapisujemy tylko metadane wycieczki/organizatora. Nie zapisujemy lokalnie zaakceptowanego
  // uczestnika, bo to powodowało różne listy uczestników na dwóch kontach.
  saveTripMetadata({
    ...(isObject(tripSource) ? tripSource : {}),
    id: tripId,
    tripId,
    organizerId: organizer.userId || organizer.id || organizerId,
    organizer: {
      ...organizer,
      role: "Organizator",
      isOrganizer: true,
    },
  });

  await ensureTripMember(tripId, currentUser.id);
}

export async function createTrip(tripData) {
  const currentUser = getCurrentUser();
  const organizerId = getOrganizerId(tripData.organizerId);
  const localTripData = {
    ...tripData,
    organizerId,
    organizer: {
      id: organizerId,
      userId: organizerId,
      name: currentUser?.name || "Organizator",
      email: currentUser?.email || "",
      avatar: currentUser?.avatar || "",
      role: "Organizator",
      isOrganizer: true,
    },
  };

  const createdTrip = await apiRequest("/trips", {
    method: "POST",
    body: JSON.stringify({
      organizerId,
      country: tripData.country,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      baseCurrency: tripData.currency || tripData.baseCurrency,
      plannedBudget: Number(tripData.budget ?? tripData.plannedBudget ?? 0),
    }),
  });

  const mergedTrip = {
    ...localTripData,
    ...(createdTrip || {}),
    id: firstValue(createdTrip?.id, createdTrip?.tripId, createdTrip?.idPodrozy, tripData.id),
    tripId: firstValue(createdTrip?.tripId, createdTrip?.id, createdTrip?.idPodrozy, tripData.id),
    organizerId,
    organizer: localTripData.organizer,
  };

  saveTripMetadata(mergedTrip);
  return normalizeTrip(mergedTrip, [], { fallbackOrganizerToCurrentUser: true });
}


const userProfileRequestCache = new Map();

function normalizeProfile(profile, fallbackId = "") {
  const source = firstValue(profile?.data, profile?.user, profile?.profile, profile?.account, profile, {});
  return normalizePersonFromSource(source, { id: fallbackId, userId: fallbackId });
}

async function fetchUserProfile(userId) {
  if (!userId || userId === "organizer" || looksLikeEmail(userId)) {
    return null;
  }

  const cacheKey = String(userId);

  if (userProfileRequestCache.has(cacheKey)) {
    return userProfileRequestCache.get(cacheKey);
  }

  const request = (async () => {
    const paths = [
      `/users/${encodeURIComponent(userId)}`,
      `/auth/users/${encodeURIComponent(userId)}`,
      `/profiles/${encodeURIComponent(userId)}`,
      `/users/profile/${encodeURIComponent(userId)}`,
    ];

    for (const path of paths) {
      try {
        const profile = await apiRequest(path, { method: "GET" });
        const normalizedProfile = normalizeProfile(profile, userId);

        if (normalizedProfile?.name || normalizedProfile?.email || normalizedProfile?.avatar) {
          return normalizedProfile;
        }
      } catch {
        // Ten backend może nie mieć publicznego endpointu profilu; wtedy korzystamy z danych /members.
      }
    }

    return null;
  })();

  userProfileRequestCache.set(cacheKey, request);
  return request;
}

function needsProfileHydration(participant) {
  if (!participant?.userId) {
    return false;
  }

  const name = participant.name || "";

  return (
    !participant.email &&
    !participant.avatar &&
    (!name || isGenericParticipantName(name) || isGenericOrganizerName(name) || isGeneratedUserLabel(name))
  );
}

async function hydrateMembersWithProfiles(members = []) {
  const normalizedMembers = members.map((member) => normalizeMember(member));
  const profilesById = new Map();

  await Promise.all(
    normalizedMembers
      .filter(needsProfileHydration)
      .map(async (member) => {
        const profile = await fetchUserProfile(member.userId);

        if (profile) {
          profilesById.set(String(member.userId), profile);
        }
      })
  );

  return normalizedMembers.map((member) => {
    const profile = profilesById.get(String(member.userId));

    if (!profile) {
      return member;
    }

    return {
      ...member,
      name: firstValue(cleanPersonName(profile.name), profile.email, member.name),
      email: firstValue(profile.email, member.email, ""),
      avatar: firstValue(profile.avatar, member.avatar, ""),
      hasProfileData: Boolean(profile.name || profile.email || profile.avatar || member.hasProfileData),
    };
  });
}

async function getTripParticipantReportMembers(tripId) {
  try {
    const report = await apiRequest(`/trips/${tripId}/reports/participants`, {
      method: "GET",
    });

    if (!Array.isArray(report)) {
      return [];
    }

    return hydrateMembersWithProfiles(report.map((participant) =>
      normalizeMember({
        ...participant,
        userId: firstValue(
          participant?.userId,
          participant?.participantId,
          participant?.id,
          participant?.accountId,
          participant?.profileId
        ),
        name: firstValue(
          participant?.name,
          participant?.fullName,
          participant?.participantName,
          participant?.login,
          participant?.userLogin,
          participant?.participantLogin,
          participant?.userName,
          participant?.username,
          participant?.displayName,
          participant?.email
        ),
        email: participant?.email || participant?.userEmail || participant?.participantEmail || "",
        avatar: firstValue(
          participant?.avatar,
          participant?.avatarUrl,
          participant?.photoUrl,
          participant?.profilePicture,
          participant?.imageUrl,
          ""
        ),
        role: firstValue(participant?.role, participant?.memberRole, participant?.participantRole),
      })
    ));
  } catch (error) {
    console.warn("Nie udało się pobrać raportu uczestników podróży:", error);
    return [];
  }
}

async function getTripMembersWithReportFallback(tripId) {
  const [membersResult, reportResult] = await Promise.allSettled([
    getTripMembers(tripId),
    getTripParticipantReportMembers(tripId),
  ]);

  const members = membersResult.status === "fulfilled" ? membersResult.value : [];
  const reportMembers = reportResult.status === "fulfilled" ? reportResult.value : [];

  return [...members, ...reportMembers];
}

export async function getOrganizerTrips(organizerId) {
  const trips = await apiRequest(`/trips/organizer/${getOrganizerId(organizerId)}`, {
    method: "GET",
  });

  if (!Array.isArray(trips)) {
    return [];
  }

  const normalizedTrips = await Promise.all(
    trips.map(async (trip) => {
      const tripId = firstValue(trip.id, trip.tripId, trip.idPodrozy);

      if (!tripId) {
        return normalizeTrip(trip, [], { fallbackOrganizerToCurrentUser: true });
      }

      try {
        const members = await getTripMembersWithReportFallback(tripId);
        return normalizeTrip(trip, members, { fallbackOrganizerToCurrentUser: true });
      } catch (error) {
        console.warn("Nie udało się pobrać uczestników podróży:", error);
        return normalizeTrip(trip, [], { fallbackOrganizerToCurrentUser: true });
      }
    })
  );

  return normalizedTrips.filter(Boolean);
}

export async function getTripMembers(tripId) {
  const members = await apiRequest(`/trips/${tripId}/members`, {
    method: "GET",
  });

  return Array.isArray(members) ? hydrateMembersWithProfiles(members) : [];
}

export async function getTripById(tripId, options = {}) {
  const trip = await apiRequest(`/trips/${tripId}`, {
    method: "GET",
  });

  let members = [];

  try {
    members = await getTripMembersWithReportFallback(tripId);
  } catch (error) {
    console.warn("Nie udało się pobrać uczestników podróży:", error);
  }

  return normalizeTrip(trip, members, options);
}

export async function removeTripMember(tripId, participant) {
  if (!tripId) {
    throw new Error("Brak ID podróży.");
  }

  const normalizedParticipant = normalizeMember(participant);
  const userId = firstValue(
    normalizedParticipant.userId,
    participant?.userId,
    participant?.id,
    getSourceId(participant?.user),
    getSourceId(participant?.account)
  );
  const memberId = firstValue(
    normalizedParticipant.memberId,
    normalizedParticipant.membershipId,
    participant?.memberId,
    participant?.membershipId,
    participant?.tripMemberId
  );

  if (!userId && !memberId) {
    throw new Error("Brak ID uczestnika do usunięcia.");
  }

  const currentUser = getCurrentUser();

  if (normalizedParticipant.isOrganizer || normalizedParticipant.role === "Organizator") {
    throw new Error("Nie można usunąć organizatora wycieczki.");
  }



  const idsToTry = [...new Set([memberId, userId].filter(Boolean).map(String))];
  const attempts = [
    ...idsToTry.map((id) => ({
      path: `/trips/${tripId}/members/${encodeURIComponent(id)}`,
      options: { method: "DELETE" },
    })),
    ...(userId
      ? [
          {
            path: `/trips/${tripId}/members?userId=${encodeURIComponent(userId)}`,
            options: { method: "DELETE" },
          },
          {
            path: `/trips/${tripId}/members`,
            options: {
              method: "DELETE",
              body: JSON.stringify({ userId, participantId: userId, memberId }),
            },
          },
        ]
      : []),
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const response = await apiRequest(attempt.path, attempt.options);

      // Po wyrzuceniu uczestnika czyścimy/resetujemy jego stare zaproszenie.
      // Bez tego backend może dalej trzymać zaakceptowane zaproszenie i blokować ponowne wysłanie
      // komunikatem „invitation already exists”. To jest best-effort: brak takiego endpointu
      // nie powinien blokować samego usunięcia uczestnika.
      if (userId) {
        clearTripInvitationForUser(tripId, userId).catch((error) => {
          console.warn("Nie udało się wyczyścić starego zaproszenia uczestnika:", error);
        });
      }

      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Nie udało się usunąć uczestnika.");
}

export async function updateTripStatus(tripId, status) {
  const updatedTrip = await apiRequest(`/trips/${tripId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return normalizeTrip(updatedTrip);
}

export async function getTripExpenses(tripId) {
  try {
    const expenses = await apiRequest(`/expenses/trip/${tripId}`, {
      method: "GET",
    });

    return Array.isArray(expenses) ? expenses.map(normalizeExpense) : [];
  } catch (error) {
    console.warn("Endpoint wydatków nie jest dostępny lub zwrócił błąd:", error);
    return [];
  }
}

export async function getInvitations() {
  return [];
}
