import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface BookingConfirmationEmailProps {
  confirmationCode: string;
  passengerName: string;
  flight: {
    airline: string;
    flightNumber: string;
    departureAirport: string;
    arrivalAirport: string;
    departureTime: string;
    arrivalTime: string;
    cabin: string;
  };
  totalPrice: string;
  bookedAt: string;
  bookingId: string;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatCabin(cabin: string): string {
  return cabin
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BookingConfirmationEmail({
  confirmationCode,
  passengerName,
  flight,
  totalPrice,
  bookedAt,
  bookingId,
}: BookingConfirmationEmailProps) {
  const previewText = `Booking confirmed: ${flight.departureAirport} → ${flight.arrivalAirport} (${confirmationCode})`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>Travel Agent</Text>
          </Section>

          {/* Greeting */}
          <Section style={content}>
            <Heading style={h1}>Your flight is booked!</Heading>
            <Text style={paragraph}>
              Hi {passengerName}, your booking has been confirmed. Here are your
              details:
            </Text>

            {/* PNR Block */}
            <Section style={pnrSection}>
              <Text style={pnrLabel}>Confirmation Code</Text>
              <Text style={pnrCode}>{confirmationCode}</Text>
            </Section>

            {/* Flight Details */}
            <Section style={flightCard}>
              <Text style={flightHeader}>
                {flight.airline} {flight.flightNumber}
              </Text>
              <Hr style={divider} />
              <Row>
                <Column style={routeColumn}>
                  <Text style={airportCode}>{flight.departureAirport}</Text>
                  <Text style={timeText}>
                    {formatDateTime(flight.departureTime)}
                  </Text>
                </Column>
                <Column style={arrowColumn}>
                  <Text style={arrow}>→</Text>
                </Column>
                <Column style={routeColumn}>
                  <Text style={airportCode}>{flight.arrivalAirport}</Text>
                  <Text style={timeText}>
                    {formatDateTime(flight.arrivalTime)}
                  </Text>
                </Column>
              </Row>
              <Hr style={divider} />
              <Text style={cabinText}>
                Cabin: {formatCabin(flight.cabin)}
              </Text>
            </Section>

            {/* Price */}
            <Section style={priceSection}>
              <Row>
                <Column>
                  <Text style={priceLabel}>Total Paid</Text>
                </Column>
                <Column style={{ textAlign: "right" as const }}>
                  <Text style={priceValue}>{totalPrice}</Text>
                </Column>
              </Row>
            </Section>

            <Text style={metaText}>
              Booked on {formatDateTime(bookedAt)}
            </Text>

            {/* CTA */}
            <Section style={ctaSection}>
              <Button
                style={ctaButton}
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/bookings`}
              >
                View Booking
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Travel Agent — Your autonomous flight booking assistant
            </Text>
            <Text style={footerText}>
              Booking ID: {bookingId}
            </Text>
            <Link href="#" style={footerLink}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  backgroundColor: "#0f172a",
  padding: "24px 32px",
};

const headerText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: 0,
};

const content: React.CSSProperties = {
  padding: "32px",
};

const h1: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 24px",
};

const pnrSection: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  border: "2px solid #22c55e",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const pnrLabel: React.CSSProperties = {
  color: "#166534",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const pnrCode: React.CSSProperties = {
  color: "#166534",
  fontSize: "32px",
  fontWeight: "bold",
  letterSpacing: "0.1em",
  margin: 0,
};

const flightCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  border: "1px solid #e2e8f0",
};

const flightHeader: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const divider: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "12px 0",
};

const routeColumn: React.CSSProperties = {
  width: "40%",
};

const arrowColumn: React.CSSProperties = {
  width: "20%",
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
};

const airportCode: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 4px",
};

const timeText: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  margin: 0,
};

const arrow: React.CSSProperties = {
  fontSize: "20px",
  color: "#94a3b8",
  margin: 0,
};

const cabinText: React.CSSProperties = {
  color: "#475569",
  fontSize: "14px",
  margin: 0,
};

const priceSection: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "16px",
  border: "1px solid #e2e8f0",
};

const priceLabel: React.CSSProperties = {
  color: "#475569",
  fontSize: "14px",
  margin: 0,
};

const priceValue: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: "bold",
  margin: 0,
};

const metaText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  margin: "0 0 24px",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 32px",
  display: "inline-block",
};

const footer: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  padding: "24px 32px",
  textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  margin: "0 0 4px",
};

const footerLink: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
};
