import { ImageResponse } from 'next/og';

/**
 * Dynamic Open Graph Image Generation
 * 
 * This creates a beautiful preview image for social media shares.
 * The image is generated on-demand and cached.
 * 
 * Size: 1200x630 (standard OG image size)
 */

export const runtime = 'edge';
export const alt = 'Azure VNet Planner - Free Azure Virtual Network Planning Tool';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Azure-style decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,120,212,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,188,212,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Network icon representation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0078d4"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M12 18h.01" />
            <path d="M8 6h8" />
            <path d="M8 10h8" />
            <path d="M8 14h4" />
          </svg>
        </div>

        {/* Main title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #0078d4, #00bcd4)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: '0 0 20px 0',
              lineHeight: 1.1,
            }}
          >
            Azure VNet Planner
          </h1>

          <p
            style={{
              fontSize: '32px',
              color: '#94a3b8',
              margin: '0 0 40px 0',
              textAlign: 'center',
            }}
          >
            Free Azure Virtual Network Planning Tool
          </p>

          {/* Feature badges */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['Subnet Calculator', 'CIDR Planning', 'Export to IaC'].map((feature) => (
              <div
                key={feature}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(0, 120, 212, 0.15)',
                  border: '1px solid rgba(0, 120, 212, 0.3)',
                  borderRadius: '9999px',
                  color: '#60a5fa',
                  fontSize: '20px',
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#64748b',
            fontSize: '18px',
          }}
        >
          <span>azvnetplanner.chrishou.se</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
