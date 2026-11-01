import { useRef } from 'react';

export default function Tilt({ children, className = '', max = 8, as: Tag = 'div', ...rest }) {
  const ref = useRef(null);

  const move = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateZ(6px)`;
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  };

  return (
    <Tag ref={ref} className={`tilt ${className}`} onMouseMove={move} onMouseLeave={leave} {...rest}>
      {children}
    </Tag>
  );
}
