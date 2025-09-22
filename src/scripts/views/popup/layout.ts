export function adjustLayoutForFirefoxDesktop(): void {
    const userAgent = navigator.userAgent;
    const isFirefox = userAgent.includes('Firefox');
    const isMobile = userAgent.includes('Mobile');

    if (isFirefox && !isMobile) {
        document.body.style.width = '350px';
    }
}
