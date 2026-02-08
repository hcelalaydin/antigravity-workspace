'use client';

export function AnimatedBackground() {
    return (
        <div className="animated-bg" aria-hidden="true">
            {/* Additional decorative orbs */}
            <div
                className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    animation: 'float-orb 15s ease-in-out infinite reverse',
                }}
            />
            <div
                className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
                    filter: 'blur(50px)',
                    animation: 'float-orb 18s ease-in-out infinite',
                    animationDelay: '-8s',
                }}
            />
        </div>
    );
}
