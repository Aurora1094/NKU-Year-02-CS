module mul8u (
    input  [7:0] a,
    input  [7:0] b,
    output [15:0] y
);

assign y = a * b;

endmodule