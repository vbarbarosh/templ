function plural(n, singular, plural, zero)
{
    if (n === 0 && typeof zero === 'string') {
        return zero;
    }
    if (n % 10 === 1 && n % 100 !== 11) {
        return singular.split('#').join(n);
    }
    return plural.split('#').join(n);
}
