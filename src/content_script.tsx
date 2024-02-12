chrome.storage.local.get(['isBlur'], function (result): void {
    if (result.isBlur) {
        document.querySelectorAll<HTMLElement>('h1,h2,h3,p,a,span').forEach((element): void => {
            element.style.filter = 'blur(5px)';

            element.addEventListener('mouseover', function (): void {
                this.style.filter = 'none';
                this.querySelectorAll<HTMLElement>('*').forEach((child): void => {
                    child.style.filter = 'none';
                });
            });

            element.addEventListener('mouseout', function () {
                this.style.filter = 'blur(5px)';
                this.querySelectorAll<HTMLElement>('*').forEach((child): void => {
                    child.style.filter = 'blur(5px)';
                });
            });
        });
    }
});