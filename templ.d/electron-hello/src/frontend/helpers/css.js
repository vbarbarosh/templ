/**
 * Insert css right before smcss module in order to be able to use smcss words.
 *
 * Usage:
 *     css`
 *     .breadcrumbs {
 *         display: flex;
 *         flex-direction: row;
 *         align-items: center;
 *         gap: 5px;
 *         padding: 0;
 *         margin: 0;
 *     }
 *     .breadcrumbs li {
 *         list-style: none;
 *     }
 *     `;
 */
function css([val])
{
    const elem = document.createElement('STYLE');
    elem.innerHTML = val;
    const sm = document.querySelector('#smcss');
    sm.parentElement.insertBefore(elem, sm);
}
