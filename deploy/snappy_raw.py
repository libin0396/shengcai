"""Decode bounded raw Snappy blocks, as used by GitHub attestation bundles."""

def decode(data, limit=8 * 1024 * 1024):
    data = memoryview(data)
    cursor = 0
    size = 0
    for shift in range(0, 35, 7):
        if cursor >= len(data): raise ValueError('truncated snappy length')
        byte = data[cursor]; cursor += 1
        size |= (byte & 127) << shift
        if byte < 128: break
    else: raise ValueError('invalid snappy length')
    if size > limit: raise ValueError('snappy output too large')
    result = bytearray()
    def read_int(length):
        nonlocal cursor
        if cursor + length > len(data): raise ValueError('truncated snappy block')
        value = int.from_bytes(data[cursor:cursor + length], 'little')
        cursor += length
        return value
    while cursor < len(data):
        tag = read_int(1)
        kind = tag & 3
        if kind == 0:
            length = tag >> 2
            length = (length + 1) if length < 60 else (read_int(length - 59) + 1)
            if cursor + length > len(data) or len(result) + length > size:
                raise ValueError('invalid snappy literal')
            result.extend(data[cursor:cursor + length])
            cursor += length
            continue
        if kind == 1:
            length = 4 + ((tag >> 2) & 7)
            offset = ((tag & 0xe0) << 3) | read_int(1)
        elif kind == 2:
            length, offset = 1 + (tag >> 2), read_int(2)
        else:
            length, offset = 1 + (tag >> 2), read_int(4)
        if not offset or offset > len(result) or len(result) + length > size:
            raise ValueError('invalid snappy copy')
        for _ in range(length): result.append(result[-offset])
    if len(result) != size: raise ValueError('incomplete snappy block')
    return bytes(result)
